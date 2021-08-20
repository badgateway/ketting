import Client from './client';
import { State, headStateFactory, HeadState, isState } from './state';
import { resolve } from './util/uri';
import { FollowPromiseOne, FollowPromiseMany } from './follow-promise';
import { Link, LinkNotFound, LinkVariables } from './link';
import { EventEmitter } from 'events';
import { GetRequestOptions, PostRequestOptions, PatchRequestOptions, PutRequestOptions, HeadRequestOptions } from './types';
import { needsJsonStringify } from './util/fetch-body-helper';
import objectHash = require('object-hash');

/**
 * A 'resource' represents an endpoint on a server.
 *
 * A resource has a uri, methods that correspond to HTTP methods,
 * and events to subscribe to state changes.
 */
export class Resource<T = any> extends EventEmitter {

  /**
   * URI of the current resource
   */
  uri: string;

  /**
   * Reference to the Client that created the resource
   */
  client: Client;

  private readonly activeRefreshes: ActiveRefreshes<T>;

  /**
   * Create the resource.
   *
   * This is usually done by the Client.
   */
  constructor(client: Client, uri: string) {
    super();
    this.client = client;
    this.uri = uri;
    this.activeRefreshes = new ActiveRefreshes<T>();
    this.setMaxListeners(500);

  }

  /**
   * Gets the current state of the resource.
   *
   * This function will return a State object.
   */
  get(getOptions?: GetRequestOptions): Promise<State<T>> {

    const state = this.getCache();
    if (state) {
      return Promise.resolve(state);
    }

    const params = optionsToRequestInit('GET', getOptions);
    const uri = this.uri;
    if (!this.activeRefreshes.has(uri, getOptions)) {
      this.activeRefreshes.put(uri, getOptions, (async (): Promise<State<T>> => {
        try {
          const response = await this.fetchOrThrow(params);
          const state = await this.client.getStateForResponse(uri, response);
          this.updateCache(state);
          return state;
        } finally {
          this.activeRefreshes.remove(uri, getOptions);
        }
      })());
    }

    return this.activeRefreshes.get(this.uri, getOptions)!;
  }

  /**
   * Does a HEAD request and returns a HeadState object.
   *
   * If there was a valid existing cache for a GET request, it will
   * still return that.
   */
  async head(headOptions?: HeadRequestOptions): Promise<HeadState> {

    let state: State|HeadState|null = this.client.cache.get(this.uri);
    if (state) {
      return state;
    }

    const response = await this.fetchOrThrow(
      optionsToRequestInit('HEAD', headOptions)
    );

    state = await headStateFactory(this.client, this.uri, response);
    return state;

  }


  /**
   * Gets the current state of the resource, skipping
   * the cache.
   *
   * This function will return a State object.
   */
  refresh(getOptions?: GetRequestOptions): Promise<State<T>> {

    const params = optionsToRequestInit('GET', getOptions);
    params.cache = 'no-cache';
    const uri = this.uri;
    if (!this.activeRefreshes.has(uri, getOptions)) {
      this.activeRefreshes.put(uri, getOptions, (async (): Promise<State<T>> => {
        try {
          const response = await this.fetchOrThrow(params);
          const state = await this.client.getStateForResponse(uri, response);
          this.updateCache(state);
          return state;
        } finally {
          this.activeRefreshes.remove(uri, getOptions);
        }
      })());
    }

    return this.activeRefreshes.get(this.uri, getOptions)!;
  }

  /**
   * Updates the server state with a PUT request
   */
  async put(options: PutRequestOptions<T> | State): Promise<void> {

    const requestInit = optionsToRequestInit('PUT', options);

    /**
     * If we got a 'State' object passed, it means we don't need to emit a
     * stale event, as the passed object is the new
     * state.
     *
     * We're gonna track that with a custom header that will be removed
     * later in the fetch pipeline.
     */
    if (isState(options)) {
      requestInit.headers.set('X-KETTING-NO-STALE', '1');
    }

    await this.fetchOrThrow(requestInit);

    if (isState(options)) {
      this.updateCache(options);

    }

  }

  /**
   * Deletes the resource
   */
  async delete(): Promise<void> {

    await this.fetchOrThrow(
      { method: 'DELETE' }
    );

  }

  /**
   * Sends a POST request to the resource.
   *
   * See the documentation for PostRequestOptions for more details.
   * This function is used for RPC-like endpoints and form submissions.
   *
   * This function will return the response as a State object.
   */
  async post(options: PostRequestOptions): Promise<State> {

    const response = await this.fetchOrThrow(
      optionsToRequestInit('POST', options)
    );

    return this.client.getStateForResponse(this.uri, response);

  }

  /**
   * Sends a POST request, and follows to the next resource.
   *
   * If a server responds with a 201 Status code and a Location header,
   * it will automatically return the newly created resource.
   *
   * If the server responded with a 204 or 205, this function will return
   * `this`.
   */
  async postFollow(options: PostRequestOptions): Promise<Resource> {

    const response = await this.fetchOrThrow(
      optionsToRequestInit('POST', options)
    );

    switch (response.status) {
      case 201:
        if (response.headers.has('location')) {
          return this.go(response.headers.get('location')!);
        }
        throw new Error('Could not follow after a 201 request, because the server did not reply with a Location header. If you sent a Location header, check if your service is returning "Access-Control-Expose-Headers: Location".');
      case 204 :
      case 205 :
        return this;
      default:
        throw new Error('Did not receive a 201, 204 or 205 status code so we could not follow to the next resource');
    }

  }

  /**
   * Sends a PATCH request to the resource.
   *
   * This function defaults to a application/json content-type header.
   *
   * If the server responds with 200 Status code this will return a State object
   */
  async patch(options: PatchRequestOptions): Promise<undefined | State<T>> {

    const response = await this.fetchOrThrow(
      optionsToRequestInit('PATCH', options)
    );

    if (response.status === 200) {
      return await this.client.getStateForResponse(this.uri, response);
    }
  }

  /**
   * Follows a relationship, based on its reltype. For example, this might be
   * 'alternate', 'item', 'edit' or a custom url-based one.
   *
   * This function can also follow templated uris. You can specify uri
   * variables in the optional variables argument.
   */
  follow<TFollowedResource = any>(rel: string, variables?: LinkVariables): FollowPromiseOne<TFollowedResource> {

    return new FollowPromiseOne(this, rel, variables);

  }

  /**
   * Follows a relationship based on its reltype. This function returns a
   * Promise that resolves to an array of Resource objects.
   *
   * If no resources were found, the array will be empty.
   */
  followAll<TFollowedResource = any>(rel: string): FollowPromiseMany<TFollowedResource> {

    return new FollowPromiseMany(this, rel);

  }

  /**
   * Resolves a new resource based on a relative uri.
   *
   * Use this function to manually get a Resource object via a uri. The uri
   * will be resolved based on the uri of the current resource.
   *
   * This function doesn't do any HTTP requests.
   */
  go<TGoResource = any>(uri: string|Link): Resource<TGoResource> {

    if (typeof uri === 'string') {
      return this.client.go(resolve(this.uri, uri));
    } else {
      return this.client.go(uri);
    }

  }

  /**
   * Does a HTTP request on the current resource URI
   */
  fetch(init?: RequestInit): Promise<Response> {

    return this.client.fetcher.fetch(this.uri, init);

  }

  /**
   * Does a HTTP request on the current resource URI.
   *
   * If the response was a 4XX or 5XX, this function will throw
   * an exception.
   */
  fetchOrThrow(init?: RequestInit): Promise<Response> {

    return this.client.fetcher.fetchOrThrow(this.uri, init);

  }

  /**
   * Updates the state cache, and emits events.
   *
   * This will update the local state but *not* update the server
   */
  updateCache(state: State<T>) {

    if (state.uri !== this.uri) {
      throw new Error('When calling updateCache on a resource, the uri of the State object must match the uri of the Resource');
    }
    this.client.cacheState(state);

  }

  /**
   * Clears the state cache for this resource.
   */
  clearCache(): void {

    this.client.clearResourceCache([this.uri],[]);

  }

  /**
   * Retrieves the current cached resource state, and return `null` if it's
   * not available.
   */
  getCache(): State<T>|null {

    return this.client.cache.get(this.uri);

  }

  /**
   * Returns a Link object, by its REL.
   *
   * If the link does not exist, a LinkNotFound error will be thrown.
   *
   * @deprecated
   */
  async link(rel: string): Promise<Link> {

    const state = await this.get();
    const link = state.links.get(rel);

    if (!link) {
      throw new LinkNotFound(`Link with rel: ${rel} not found on ${this.uri}`);
    }
    return link;

  }

  /**
   * Returns all links defined on this object.
   *
   * @deprecated
   */
  async links(rel?: string): Promise<Link[]> {

    const state = await this.get();
    if (!rel) {
      return state.links.getAll();
    } else {
      return state.links.getMany(rel);
    }

  }

  /**
   *
   * Returns true or false depending on if a link with the specified relation
   * type exists.
   *
   * @deprecated
   */
  async hasLink(rel: string): Promise<boolean> {

    const state = await this.get();
    return state.links.has(rel);

  }
}

// eslint doesn't like that we have a generic T but not using it.
// eslint-disable-next-line
export declare interface Resource<T = any> {

  /**
   * Subscribe to the 'update' event.
   *
   * This event will get triggered whenever a new State is received
   * from the server, either through a GET request or if it was
   * transcluded.
   *
   * It will also trigger when calling 'PUT' with a full state object,
   * and when updateCache() was used.
   */
  on(event: 'update', listener: (state: State) => void) : this;

  /**
   * Subscribe to the 'stale' event.
   *
   * This event will get triggered whenever an unsafe method was
   * used, such as POST, PUT, PATCH, etc.
   *
   * When any of these methods are used, the local cache is stale.
   */
  on(event: 'stale',  listener: () => void) : this;

  /**
   * Subscribe to the 'delete' event.
   *
   * This event gets triggered when the `DELETE` http method is used.
   */
  on(event: 'delete', listener: () => void) : this;

  /**
   * Subscribe to the 'update' event and unsubscribe after it was
   * emitted the first time.
   */
  once(event: 'update', listener: (state: State) => void) : this;

  /**
   * Subscribe to the 'stale' event and unsubscribe after it was
   * emitted the first time.
   */
  once(event: 'stale',  listener: () => void) : this;

  /**
   * Subscribe to the 'delete' event and unsubscribe after it was
   * emitted the first time.
   */
  once(event: 'delete', listener: () => void) : this;

  /**
   * Unsubscribe from the 'update' event
   */
  off(event: 'update', listener: (state: State) => void) : this;

  /**
   * Unsubscribe from the 'stale' event
   */
  off(event: 'stale',  listener: () => void) : this;

  /**
   * Unsubscribe from the 'delete' event
   */
  off(event: 'delete', listener: () => void) : this;

  /**
   * Emit an 'update' event.
   */
  emit(event: 'update', state: State) : boolean;

  /**
   * Emit a 'stale' event.
   */
  emit(event: 'stale') : boolean;

  /**
   * Emit a 'delete' event.
   */
  emit(event: 'delete') : boolean;

}

export default Resource;

type StrictRequestInit = RequestInit & {
  headers: Headers;
};

/**
 * Convert request options to RequestInit
 *
 * RequestInit is passed to the constructor of fetch(). We have our own 'options' format
 */
function optionsToRequestInit(method: 'GET', options?: GetRequestOptions): StrictRequestInit;
function optionsToRequestInit(method: 'HEAD', options?: HeadRequestOptions): StrictRequestInit;
function optionsToRequestInit(method: 'PATCH', options?: PatchRequestOptions): StrictRequestInit;
function optionsToRequestInit(method: 'POST', options?: PostRequestOptions): StrictRequestInit;
function optionsToRequestInit(method: 'PUT', options?: PutRequestOptions): StrictRequestInit;
function optionsToRequestInit(method: string, options?: GetRequestOptions | PostRequestOptions | PatchRequestOptions | PutRequestOptions): StrictRequestInit {

  if (!options) {
    return {
      method,
      headers: new Headers(),
    };
  }
  let headers;
  if (options.getContentHeaders) {
    headers = new Headers(options.getContentHeaders());
  } else if (options.headers) {
    headers = new Headers(options.headers);
  } else {
    headers = new Headers();
  }
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  let body;
  if ((options as any).serializeBody !== undefined) {
    body = (options as any).serializeBody();
  } else if ((options as any).data) {
    body = (options as any).data;
    if (needsJsonStringify(body)) {
      body = JSON.stringify(body);
    }
  } else {
    body = null;
  }
  return {
    method,
    body,
    headers,
  };

}

class ActiveRefreshes<T = any> {
  private readonly refreshBySerializedRequest: Map<string, Promise<State<T>>> = new Map<string, Promise<State<T>>>();

  put(uri: string, options: GetRequestOptions | undefined, activeRefresh: Promise<State<T>>): void {
    this.refreshBySerializedRequest.set(this.hash(uri, options), activeRefresh);
  }

  get(uri: string, options: GetRequestOptions | undefined): Promise<State<T>> | undefined {
    return this.refreshBySerializedRequest.get(this.hash(uri, options));
  }

  has(uri: string, options: GetRequestOptions | undefined): boolean {
    return !!this.get(uri, options);
  }

  remove(uri: string, options: GetRequestOptions | undefined): boolean {
    return this.refreshBySerializedRequest.delete(this.hash(uri, options));
  }

  private hash(uri: string, options: GetRequestOptions | undefined): string {
    if (!options) {
      return objectHash(uri);
    }
    const sortedHeaders: Record<string, string> = {};
    new Headers(options.getContentHeaders?.() || options.headers)
      .forEach((value, key) => {
        sortedHeaders[key] = value.split(', ').sort().toString();
      });
    return objectHash(uri) + objectHash(sortedHeaders);
  }
}
