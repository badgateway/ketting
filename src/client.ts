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
import { parseContentType } from './http/util';
import { resolve } from './util/uri';
import { LinkVariables } from './link';
import { FollowPromiseOne } from './follow-promise';
import { StateCache, ForeverCache } from './cache';
import cacheExpireMiddleware from './middlewares/cache';
import acceptMiddleware from './middlewares/accept-header';
import warningMiddleware from './middlewares/warning';

export default class Client {

  /**
   * All relative urls will by default use the bookmarkUri to
   * expand. It should usually be the starting point of your
   * API
   */
  bookmarkUri: string;

  /**
   * Supported content types
   *
   * Each content-type has a 'factory' that turns a HTTP response
   * into a State object.
   *
   * The last value in the array is the 'q=' value, used in Accept
   * headers. Higher means higher priority.
   */
  contentTypeMap: {
    [mimeType: string]: [StateFactory<any>, string];
  } = {
      'application/prs.hal-forms+json': [halStateFactory, '1.0'],
      'application/hal+json': [halStateFactory, '0.9'],
      'application/vnd.api+json': [jsonApiStateFactory, '0.8'],
      'application/vnd.siren+json': [sirenStateFactory, '0.8'],
      'application/vnd.collection+json': [cjStateFactory, '0.8'],
      'application/json': [halStateFactory, '0.7'],
      'text/html': [htmlStateFactory, '0.6'],
    };

  /**
   * The cache for 'State' objects
   */
  cache: StateCache;

  /**
   * The cache for 'Resource' objects. Each unique uri should
   * only ever get 1 associated resource.
   */
  resources: Map<string, Resource>;

  /**
   * Fetcher is a utility object that handles fetch() requests
   * and middlewares.
   */
  fetcher: Fetcher;

  constructor(bookmarkUri: string) {
    this.bookmarkUri = bookmarkUri;
    this.fetcher = new Fetcher();
    this.fetcher.use(cacheExpireMiddleware(this));
    this.fetcher.use(acceptMiddleware(this));
    this.fetcher.use(warningMiddleware());
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
      const resource = new Resource(this, absoluteUri);
      this.resources.set(absoluteUri, resource);
      return resource;
    }
    return this.resources.get(absoluteUri)!;

  }

  /**
   * Adds a fetch middleware, which will be executed for
   * each fetch() call.
   *
   * If 'origin' is specified, fetch middlewares can be executed
   * only if the host/origin matches.
   */
  use(middleware: FetchMiddleware, origin: string = '*') {

    this.fetcher.use(middleware, origin);

  }

  /**
   * Clears the entire state cache
   */
  clearCache() {

    this.cache.clear();

  }

  /**
   * Transforms a fetch Response to a State object.
   */
  async getStateForResponse(uri: string, response: Response): Promise<State> {

    const contentType = parseContentType(response.headers.get('Content-Type')!);

    if (!contentType || response.status === 204) {
      return binaryStateFactory(this, uri, response);
    }

    if (contentType in this.contentTypeMap) {
      return this.contentTypeMap[contentType][0](this, uri, response);
    } else if (contentType.startsWith('text/')) {
      // Default to TextState for any format starting with text/
      return textStateFactory(this, uri, response);
    } else if (contentType.match(/^application\/[A-Za-z-.]+\+json/)) {
      // Default to HalState for any format containing a pattern like application/*+json
      return halStateFactory(this, uri, response);
    } else {
      return binaryStateFactory(this, uri, response);
    }

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

}
