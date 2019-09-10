import FollowablePromise from './followable-promise';
import Representor from './representor/base';
import HalRepresentor from './representor/hal';
import HtmlRepresentor from './representor/html';
import JsonApiRepresentor from './representor/jsonapi';
import Resource from './resource';
import { ContentType, KettingInit } from './types';
import FetchHelper from './utils/fetch-helper';
import './utils/fetch-polyfill';
import { resolve } from './utils/url';

/**
 * The main Ketting client object.
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

  /**
   * Content-Type settings and mappings.
   *
   * See the constructor for an example of the structure.
   */
  contentTypes: ContentType[];

  /**
   * The helper class that calls fetch() for us
   */
  private fetchHelper: FetchHelper;

  constructor(bookMark: string, options?: KettingInit) {

    if (typeof options === 'undefined') {
      options = {};
    }

    this.resourceCache = {};

    this.contentTypes = [
      {
        mime: 'application/hal+json',
        representor: 'hal',
        q: '1.0',
      },
      {
        mime: 'application/vnd.api+json',
        representor: 'jsonapi',
        q: '0.9',
      },
      {
        mime: 'application/json',
        representor: 'hal',
        q: '0.8',
      },
      {
        mime: 'text/html',
        representor: 'html',
        q: '0.7',
      }
    ];

    this.bookMark = bookMark;
    this.fetchHelper = new FetchHelper(options, this.beforeRequest.bind(this));

  }

  /**
   * This function is a shortcut for getResource().follow(x);
   */
  follow(rel: string, variables?: object): FollowablePromise {

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
   */
  go(uri?: string): Resource {

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
   */
  getResource(uri?: string): Resource {

    return this.go(uri);

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

  /**
   * This function returns a representor constructor for a mime type.
   *
   * For example, given text/html, this function might return the constructor
   * stored in representor/html.
   */
  getRepresentor(contentType: string): typeof Representor {

    if (contentType.indexOf(';') !== -1) {
      contentType = contentType.split(';')[0];
    }
    contentType = contentType.trim();
    const result = this.contentTypes.find(item => {
      return item.mime === contentType;
    });

    if (!result) {
      throw new Error('Could not find a representor for contentType: ' + contentType);
    }

    switch (result.representor) {
    case 'html' :
        return HtmlRepresentor;
    case 'hal' :
        return HalRepresentor;
    case 'jsonapi' :
        return JsonApiRepresentor;
    default :
      throw new Error('Unknown representor: ' + result.representor);

    }

  }


  /**
   * Generates an accept header string, based on registered Resource Types.
   */
  getAcceptHeader(): string {

    return this.contentTypes
      .map( contentType => {
        let item = contentType.mime;
        if (contentType.q) { item += ';q=' + contentType.q; }
        return item;
      } )
      .join(', ');

  }

  beforeRequest(request: Request): void {

    const safeMethods = ['GET', 'HEAD', 'OPTIONS', 'PRI', 'PROPFIND', 'REPORT', 'SEARCH', 'TRACE'];
    if (safeMethods.includes(request.method)) {
      return;
    }

    if (request.url in this.resourceCache) {
      // Clear cache
      this.resourceCache[request.url].clearCache();
    }
  }

}
