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
import { resolve } from './util/url';
import { LinkVariables } from './link';
import { FollowPromiseOne } from './follow-promise';
import { StateCache, ForeverCache } from './cache';

export default class Client {

  fetcher: Fetcher;
  bookmarkUri: string;

  contentTypeMap: {
    [mimeType: string]: [StateFactory<any>, string],
  } = {
    'application/hal+json': [halStateFactory, '1.0'],
    'application/vnd.api+json': [jsonApiStateFactory, '0.9'],
    'application/vnd.siren+json': [jsonApiStateFactory, '0.9'],
    'application/vnd.collection+json': [cjStateFactory, '0.9'],
    'application/json': [halStateFactory, '0.8'],
    'text/html': [htmlStateFactory, '0.7'],
  }

  cache: StateCache;

  resources: Map<string, Resource>;

  constructor(bookmarkUri: string) {
    this.bookmarkUri = bookmarkUri;
    this.fetcher = new Fetcher();
    this.fetcher.use( this.cacheHandler );
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
  getStateForResponse(uri: string, response: Response): Promise<State> {

    const contentType = parseContentType(response.headers.get('Content-Type')!);
    if (contentType in this.contentTypeMap) {
      return this.contentTypeMap[contentType][0](uri, response);
    }

    if (contentType.startsWith('text/')) {
      return textStateFactory(uri, response);
    } else{
      return binaryStateFactory(uri, response);
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

  private cacheHandler: FetchMiddleware = async(request, next) => {

    const response = await next(request);
    this.cache.processRequest(request, response);
    return response;

  };

}
