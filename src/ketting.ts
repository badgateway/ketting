import FollowablePromise from './followable-promise';
import Representor from './representor/base';
import HalRepresentor from './representor/hal';
import HtmlRepresentor from './representor/html';
import JsonApiRepresentor from './representor/jsonapi';
import Resource from './resource';
import * as base64 from './utils/base64';
import * as fetchHelper from './utils/fetch-helper';
import './utils/fetch-polyfill';
import { OAuth2Helper, OAuth2Init } from './utils/oauth';
import { resolve } from './utils/url';

type ContentType = {
  mime: string,
  representor: string,
  q?: string
};

type AuthOptionsBasic = {
  type: 'basic'
  password: string
  userName: string
};
type AuthOptionsBearer = {
  type: 'bearer'
  token: string
};
type AuthOptionsOAuth2 = {
  type: 'oauth2',
} & OAuth2Init;

type AuthOptions =
  AuthOptionsBasic |
  AuthOptionsBearer |
  AuthOptionsOAuth2;

type KettingOptions = {
  auth?: AuthOptions
  fetchInit?: RequestInit
};


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
   * Autentication settings.
   *
   * If set, must have at least a `type` property.
   * If type=basic, userName and password must be set.
   */
  auth: AuthOptions;

  /**
   * Content-Type settings and mappings.
   *
   * See the constructor for an example of the structure.
   */
  contentTypes: ContentType[];

  /**
   * A list of settings passed to the Fetch API.
   *
   * It's effectively a list of defaults that are passed as the 'init' argument.
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Request/Request
   */
  fetchInit: RequestInit;

  /**
   * If OAuth2 was configured, this property gives access to OAuth2-related
   * operations.
   */
  oauth2Helper: OAuth2Helper;

  constructor(bookMark: string, options?: KettingOptions) {

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

    if (options.auth) {
      this.auth = options.auth;

      if (options.auth.type === 'oauth2') {
        this.oauth2Helper = new OAuth2Helper(
          options.auth
        );
      }
    }

    if (options.fetchInit) {
      this.fetchInit = options.fetchInit;
    }

    this.bookMark = bookMark;

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
   * Every request in ketting is routed through here so it can be initialized
   * with some useful defaults.
   *
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/GlobalFetch}
   */
  fetch(input: string|Request, init?: RequestInit): Promise<Response> {

    const request = fetchHelper.createFetchRequest(input, init, this.fetchInit);

    if (!request.headers.has('User-Agent')) {
      request.headers.set('User-Agent', 'Ketting/' + require('../package.json').version);
    }
    if (!request.headers.has('Authorization') && this.auth) {
      switch (this.auth.type) {

        case 'basic' :
          request.headers.set('Authorization', 'Basic ' + base64.encode(this.auth.userName + ':' + this.auth.password));
          break;
        case 'bearer' :
          request.headers.set('Authorization', 'Bearer ' + this.auth.token);
          break;
        case 'oauth2' :
          return this.oauth2Helper.fetch(request);
      }

    }

    return fetch(request);

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

}
