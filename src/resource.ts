import Client from './client';
import { State } from './state';
import { resolve } from './util/uri';
import { FollowPromiseOne, FollowPromiseMany } from './follow-promise';
import { Link, LinkNotFound, LinkVariables } from './link';
import { GetRequestOptions, PostRequestOptions, PatchRequestOptions, PutRequestOptions } from './types';

/**
 * A 'resource' represents an endpoint on the server.
 *
 * The endpoint has a uri, you might for example be able to GET its
 * presentation.
 *
 * A resource may also have a list of links on them, pointing to other
 * resources.
 */
export default class Resource<T = any> {

  uri: string;
  client: Client;

  activeRefresh: Promise<State<T>> | null;

  /**
   * uri must be absolute
   */
  constructor(client: Client, uri: string) {
    this.client = client;
    this.uri = uri;
    this.activeRefresh = null;

  }

  /**
   * Gets the current state of the resource.
   *
   * This function will return a State object.
   */
  get(getOptions?: GetRequestOptions): Promise<State<T>> {

    const state = this.client.cache.get(this.uri);
    if (!state) {
      return this.refresh(getOptions);
    }
    return Promise.resolve(state);

  }

  /**
   * Gets the current state of the resource, skipping
   * the cache.
   *
   * This function will return a State object.
   */
  refresh(getOptions?: GetRequestOptions): Promise<State<T>> {

    const params: RequestInit = {};
    if (getOptions?.getContentHeaders) {
      params.headers = getOptions.getContentHeaders();
    }
    if (!this.activeRefresh) {
      this.activeRefresh = (async() : Promise<State<T>> => {
        try {
          const response = await this.fetchOrThrow(params);
          const state = await this.client.getStateForResponse(this.uri, response);
          this.client.cache.store(state);
          return state;
        } finally {
          this.activeRefresh = null;
        }
      })();
    }

    return this.activeRefresh;

  }

  /**
   * Updates the server state with a PUT request
   */
  async put(options: PutRequestOptions<T>): Promise<void> {

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
    if (options.serializeBody) {
      body = options.serializeBody();
    } else if (options.body) {
      body = options.body;
      if (!(body instanceof Buffer) && typeof body !== 'string') {
        body = JSON.stringify(body);
      }
    } else {
      body = null;
    }

    const params = {
      method: 'PUT',
      body,
      headers,
    };
    await this.fetchOrThrow(params);

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
   *
   * This function assumes that POST is used to create new resources, and
   * that the response will be a 201 Created along with a Location header that
   * identifies the new resource location.
   *
   * This function returns a Promise that resolves into the newly created
   * Resource.
   *
   * If no Location header was given, it will resolve still, but with an empty
   * value.
   */
  post(options: PostRequestOptions): Promise<Resource | null>;
  post<TPostResource>(options: PostRequestOptions): Promise<Resource<TPostResource>>;
  async post(options: PostRequestOptions): Promise<Resource | null> {

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
    if (options.serializeBody) {
      body = options.serializeBody();
    } else if (options.body) {
      body = options.body;
      if (!(body instanceof Buffer) && typeof body !== 'string') {
        body = JSON.stringify(body);
      }
    } else {
      body = null;
    }
    const response = await this.fetchOrThrow(
      {
        method: 'POST',
        body,
        headers,
      }
    );

    switch (response.status) {
      case 205 :
        return this;
      case 201:
        if (response.headers.has('location')) {
          return this.go(<string> response.headers.get('location'));
        }
        return null;
      default:
        return null;
    }

  }

  /**
   * Sends a PATCH request to the resource.
   *
   * This function defaults to a application/json content-type header.
   */
  async patch(options: PatchRequestOptions): Promise<void> {

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
    if (options.serializeBody) {
      body = options.serializeBody();
    } else if (options.body) {
      body = options.body;
      if (!(body instanceof Buffer) && typeof body !== 'string') {
        body = JSON.stringify(body);
      }
    } else {
      body = null;
    }
    await this.fetchOrThrow(
      {
        method: 'PATCH',
        body,
        headers
      }
    );

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
  go<TGoResource = any>(uri: string): Resource<TGoResource> {

    uri = resolve(this.uri, uri);
    return this.client.go(uri);

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
   * Clears the state cache for this resource.
   */
  clearCache(): void {

    this.client.cache.delete(this.uri);

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
