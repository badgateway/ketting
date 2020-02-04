import * as LinkHeader from 'http-link-header';
import { FollowerOne } from './follower';
import RepresentorHelper from './representor/helper';
import Resource from './resource';
import { KettingInit, LinkVariables } from './types';
import FetchHelper from './utils/fetch-helper';
import './utils/fetch-polyfill';
import { isSafeMethod } from './utils/http';
import { resolve } from './utils/url';

/**
 * The main Ketting client object.
 *
 * This is the starting point for working with Ketting.
 */
export default class Ketting {

  /**
   * The url from which all discovery starts.
   */
  bookMark: string;

  /**
   * Here we store all the resources that were ever requested. This will
   * ensure that if the same resource is requested twice, the same object is
   * returned.
   */
  resourceCache: { [url: string]: Resource };

  representorHelper: RepresentorHelper;

  /**
   * The helper class that calls fetch() for us
   */
  private fetchHelper: FetchHelper;

  constructor(bookMark: string, options?: KettingInit) {

    if (typeof options === 'undefined') {
      options = {};
    }

    this.resourceCache = {};

    this.bookMark = bookMark;

    this.representorHelper = new RepresentorHelper(
      options.contentTypes || [],
    );
    this.fetchHelper = new FetchHelper(options, this.beforeRequest.bind(this), this.afterRequest.bind(this));

  }

  /**
   * This function is a shortcut for getResource().follow(x);
   */
  follow<TResource = any>(rel: string, variables?: LinkVariables): FollowerOne<TResource> {

    return this.getResource().follow(rel, variables);

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

    if (typeof uri === 'undefined') {
      uri = '';
    }
    uri = resolve(this.bookMark, uri);

    if (!this.resourceCache[uri]) {
      this.resourceCache[uri] = new Resource(this, uri);
    }

    return this.resourceCache[uri];

  }

  /**
   * Returns a resource by its uri.
   *
   * This function doesn't do any HTTP requests. The uri is optional. If it's
   * not specified, it will return the bookmark resource.
   *
   * @deprecated use go() instead.
   */
  getResource(uri?: string): Resource {

    return this.go(uri);

  }

  /**
   * Returns a list of all Ketting options.
   *
   * The primary purpose of this is for hydrating all options in for example LocalStorage.
   *
   * The options will not be an exact copy of what was passed, but instead will
   * contain properties like refreshToken and accessToken, allowing authentication information
   * to be cached.
   *
   * NOTE that this function is experimental and only handles top-level settings, and not for
   * specific domains.
   */
  getOptions(): Promise<KettingInit> {

    return this.fetchHelper.getOptions();

  }

  /**
   * This function does an arbitrary request using the fetch API.
   *
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/GlobalFetch}
   */
  fetch(input: string|Request, init?: RequestInit): Promise<Response> {

    return this.fetchHelper.fetch(
      input,
      init
    );

  }


  beforeRequest(request: Request): void {

    if (isSafeMethod(request.method)) { return; }

    if (request.url in this.resourceCache) {
      // Clear cache
      this.resourceCache[request.url].clearCache();
    }
  }

  afterRequest(request: Request, response: Response): void {

    if (isSafeMethod(request.method)) { return; }
    if (response.headers.has('Link')) {
      for (const httpLink of LinkHeader.parse(response.headers.get('Link')!).rel('invalidates')) {
        const uri = resolve(request.url, httpLink.uri);
        if (uri in this.resourceCache) {
          this.resourceCache[uri].clearCache();
        }
      }
    }

  }

}
