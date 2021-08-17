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
import { Link, LinkVariables } from './link';
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

  /**
   * Resource.activeRefresh behave as a very short cache
   * even if we use the NeverCache implementation.
   *
   * By setting to True this property, this will allow the resource to do multiple parallel refreshes,
   * False maintains the backward compatibility.
   */
  allowMultipleParallelRefreshes: boolean;

  constructor(bookmarkUri: string) {
    this.bookmarkUri = bookmarkUri;
    this.fetcher = new Fetcher();
    this.fetcher.use(cacheExpireMiddleware(this));
    this.fetcher.use(acceptMiddleware(this));
    this.fetcher.use(warningMiddleware());
    this.cache = new ForeverCache();
    this.resources = new Map();
    this.allowMultipleParallelRefreshes = false;
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
  go<TResource = any>(uri?: string|Link): Resource<TResource> {

    let absoluteUri;
    if (uri === undefined) {
      absoluteUri = this.bookmarkUri;
    } else if (typeof uri === 'string') {
      absoluteUri = resolve(this.bookmarkUri, uri);
    } else {
      absoluteUri = resolve(uri);
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
    this.cacheDependencies = new Map();

  }

  /**
   * Caches a State object
   *
   * This function will also emit 'update' events to resources, and store all
   * embedded states.
   */
  cacheState(state: State) {

    // Flatten the list of state objects.
    const newStates = flattenState(state);

    // Register all cache dependencies.
    for(const nState of newStates) {
      for(const invByLink of nState.links.getMany('inv-by')) {
        this.addCacheDependency(resolve(invByLink), nState.uri);
      }
    }

    // Store all new caches
    for(const nState of newStates) {
      this.cache.store(nState);
    }

    // Emit 'update' events
    for(const nState of newStates) {
      const resource = this.resources.get(nState.uri);
      if (resource) {
        // We have a resource for this object, notify it as well.
        resource.emit('update', nState);
      }
    }

  }

  /**
   * cacheDependencies contains all cache relationships between
   * resources.
   *
   * This lets a user (for example) let a resource automatically
   * expire, if another one expires.
   *
   * A server can populate this list using the `inv-by' link.
   *
   * @deprecated This property will go private in a future release.
   */
  public cacheDependencies: Map<string, Set<string>> = new Map();

  /**
   * Adds a cache dependency between two resources.
   *
   * If the 'target' resource ever expires, it will cause 'dependentUri' to
   * also expire.
   *
   * Both argument MUST be absolute urls.
   */
  addCacheDependency(targetUri: string, dependentUri: string): void {

    if (this.cacheDependencies.has(targetUri)) {
      this.cacheDependencies.get(targetUri)!.add(dependentUri);
    } else {
      this.cacheDependencies.set(targetUri, new Set([dependentUri]));
    }

  }

  /**
   * Helper function for clearing the cache for a resource.
   *
   * This function will also emit the 'stale' event for resources that have
   * subscribers, and handle any dependent resource caches.
   *
   * If any resources are specified in deletedUris, those will not
   * receive 'stale' events, but 'delete' events instead.
   */
  clearResourceCache(staleUris: string[], deletedUris: string[]) {

    let stale = new Set<string>();
    const deleted = new Set<string>();
    for(const uri of staleUris) {
      stale.add(resolve(this.bookmarkUri, uri));
    }
    for(const uri of deletedUris) {
      stale.add(resolve(this.bookmarkUri, uri));
      deleted.add(resolve(this.bookmarkUri, uri));
    }

    stale = expandCacheDependencies(
      new Set([...stale, ...deleted]),
      this.cacheDependencies
    );

    for(const uri of stale) {
      this.cache.delete(uri);

      const resource = this.resources.get(uri);
      if (resource) {
        if (deleted.has(uri)) {
          resource.emit('delete');
        } else {
          resource.emit('stale');
        }

      }

    }

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


}



/**
 * Find all dependencies for a given resource.
 *
 * For example, if
 *   * if resourceA depends on resourceB
 *   * and resourceB depends on resourceC
 *
 * Then if 'resourceC' expires, so should 'resourceA' and 'resourceB'.
 *
 * This function helps us find these dependencies recursively and guarding
 * against recursive loops.
 */
function expandCacheDependencies(uris: Set<string>, dependencies: Map<string, Set<string>>, output?: Set<string>): Set<string> {

  if (!output) output = new Set();

  for(const uri of uris) {

    if (!output.has(uri)) {
      output.add(uri);
      if (dependencies.has(uri)) {
        expandCacheDependencies(dependencies.get(uri)!, dependencies, output);
      }
    }

  }

  return output;

}

/**
 * Take a State object, find all it's embedded resources and return a flat
 * array of all resources at any depth.
 */
function flattenState(state: State, result: Set<State> = new Set<State>()): Set<State> {

  result.add(state);
  for(const embedded of state.getEmbedded()) {
    flattenState(embedded, result);
  }
  return result;

}
