import { Fetcher, FetchMiddleware } from './http/fetcher';
import Resource from './resource';
import { State, StateFactory } from './state';
import {
  halStateFactory,
  binaryStateFactory,
  jsonApiStateFactory,
  sirenStateFactory,
  textStateFactory,
  cjStateFactory,
  htmlStateFactory
} from './state';
import { parseContentType, isSafeMethod } from './http/util';
import { resolve } from './util/uri';
import { LinkVariables } from './link';
import { FollowPromiseOne } from './follow-promise';
import { StateCache, ForeverCache } from './cache';
import * as LinkHeader from 'http-link-header';

export default class Client {

  fetcher: Fetcher;
  bookmarkUri: string;

  contentTypeMap: {
    [mimeType: string]: [StateFactory<any>, string],
  } = {
    'application/hal+json': [halStateFactory, '1.0'],
    'application/vnd.api+json': [jsonApiStateFactory, '0.9'],
    'application/vnd.siren+json': [sirenStateFactory, '0.9'],
    'application/vnd.collection+json': [cjStateFactory, '0.9'],
    'application/json': [halStateFactory, '0.8'],
    'text/html': [htmlStateFactory, '0.7'],
  }

  cache: StateCache;

  resources: Map<string, Resource>;

  constructor(bookmarkUri: string) {
    this.bookmarkUri = bookmarkUri;
    this.fetcher = new Fetcher();
    this.fetcher.use( this.cacheExpireHandler );
    this.fetcher.use( this.acceptHeader );
    this.cache = new ForeverCache();
    this.resources = new Map();
  }

  /**
   * Follows a relationship, based on its reltype. For example, this might be
   * 'alternate', 'item', 'edit' or a custom url-based one.
   *
   * This function can also follow templated uris. You can specify uri
   * variables in the optional variables argument.
   */
  follow<TFollowedResource = any>(rel: string, variables?: LinkVariables): FollowPromiseOne<TFollowedResource> {

    return this.go().follow(rel, variables);

  }

  /**
   * Returns a resource by its uri.
   *
   * This function doesn't do any HTTP requests. The uri is optional. If it's
   * not specified, it will return the bookmark resource.
   *
   * If a relative uri is passed, it will be resolved based on the bookmark
   * uri.
   *
   * @example
   * const res = ketting.go('https://example.org/);
   * @example
   * const res = ketting.go<Author>('/users/1');
   * @example
   * const res = ketting.go(); // bookmark
   */
  go<TResource = any>(uri?: string): Resource<TResource> {

    let absoluteUri;
    if (uri !== undefined) {
      absoluteUri = resolve(this.bookmarkUri, uri);
    } else {
      absoluteUri = this.bookmarkUri;
    }
    if (!this.resources.has(absoluteUri)) {
      const resource = new Resource(this, absoluteUri)
      this.resources.set(absoluteUri, resource);
      return resource;
    }
    return this.resources.get(absoluteUri)!;

  }

  use(middleware: FetchMiddleware, origin: string = '*') {

    this.fetcher.use(middleware, origin);

  }

  /**
   * Clears the entire resource cache
   */
  clearCache() {

    this.cache.clear();

  }

  /**
   * Transforms a fetch Response to a State object.
   */
  async getStateForResponse(uri: string, response: Response): Promise<State> {

    const contentType = parseContentType(response.headers.get('Content-Type')!);

    let state: State;

    if (!contentType) {
      return binaryStateFactory(uri, response);
    }

    if (contentType in this.contentTypeMap) {
      state = await this.contentTypeMap[contentType][0](uri, response);
    } else if (contentType.startsWith('text/')) {
      state = await textStateFactory(uri, response);
    } else{
      state = await binaryStateFactory(uri, response);
    }
    return state;

  }

  /**
   * Caches a State object
   *
   * This function will also emit 'update' events to resources, and store all
   * embedded states.
   */
  cacheState(state: State) {

    this.cache.store(state);
    const resource = this.resources.get(state.uri);
    if (resource) {
      // We have a resource for this object, notify it as well.
      resource.emit('update', state);
    }

    for(const embeddedState of state.getEmbedded()) {
      // Recursion. MADNESS
      this.cacheState(embeddedState);
    }

  }

  private acceptHeader: FetchMiddleware = (request, next) => {

    if (!request.headers.has('Accept')) {
      const acceptHeader = Object.entries(this.contentTypeMap).map(
        ([contentType, [stateFactory, q]]) => contentType + ';q=' + q
      ).join(', ');
      request.headers.set('Accept', acceptHeader);
    }
    return next(request);

  };

  private cacheExpireHandler: FetchMiddleware = async(request, next) => {

    /**
     * Prevent a 'stale' event from being emitted, but only for the main
     * uri
     */
    let noStaleEvent = false;

    if (request.headers.has('X-KETTING-NO-STALE')) {
      noStaleEvent = true;
      request.headers.delete('X-KETTING-NO-STALE');
    }

    const response = await next(request);
    if (isSafeMethod(request.method)) {
      return response;
    }

    if (!response.ok) {
      // There was an error, no cache changes
      return response;
    }

    // We just processed an unsafe method, lets notify all subsystems.
    const expireUris = [];
    if (!noStaleEvent && request.method !== 'DELETE') {
      // Sorry for the double negative
      expireUris.push(request.url);
    }

    // If the response had a Link: rel=invalidate header, we want to
    // expire those too.
    if (response.headers.has('Link')) {
      for (const httpLink of LinkHeader.parse(response.headers.get('Link')!).rel('invalidates')) {
        const uri = resolve(request.url, httpLink.uri);
        expireUris.push(uri);
      }
    }

    // Location headers should also expire
    if (response.headers.has('Location')) {
      expireUris.push(
        resolve(request.url, response.headers.get('Location')!)
      );
    }
    // Content-Location headers should also expire
    if (response.headers.has('Content-Location')) {
      expireUris.push(
        resolve(request.url, response.headers.get('Content-Location')!)
      );
    }

    for (const uri of expireUris) {
      this.cache.delete(request.url);

      const resource = this.resources.get(uri);
      if (resource) {
        // We have a resource for this object, notify it as well.
        resource.emit('stale');
      }
    }
    if (request.method === 'DELETE') {
      this.cache.delete(request.url);
      const resource = this.resources.get(request.url);
      if (resource) {
        resource.emit('delete');
      }
    }

    return response;

  };

}
