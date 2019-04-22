import OAuth2 from 'fetch-mw-oauth2';
import { KettingInit, NormalizedOptions } from '../types';
import * as base64 from './base64';
import './fetch-polyfill';
import { parse } from './url';

/**
 * This class is primarily responsible for calling fetch().
 *
 * It's main purpose besides that is to add authentication headers, and
 * any defaults that might have been set.
 */
export default class FetchHelper {

  options: KettingInit;

  private oAuth2Buckets: Map<string, OAuth2>;

  constructor(options: KettingInit) {
    this.options = options;
    this.oAuth2Buckets = new Map();
  }

  fetch(requestInfo: RequestInfo, requestInit: RequestInit): Promise<Response> {

    const domainOptions = this.getDomainOptions(
      typeof requestInfo === 'string' ?
      requestInfo :
      requestInfo.url
    );

    const init = mergeInit([
      this.options.fetchInit,
      domainOptions.fetchInit,
      requestInit,
      {
        headers: requestInfo instanceof Request ? requestInfo.headers : {},
      },
    ]);

    const request = new Request(
      requestInfo,
      init
    );

    if (!request.headers.has('User-Agent')) {
      request.headers.set('User-Agent', 'Ketting/' + require('../../package.json').version);
    }

    return this.fetchAuth(request);

  }

  getDomainOptions(uri: string): NormalizedOptions {

    if (!this.options.match) {
      return {};
    }

    const { host } = parse(uri);

    if (this.options.match[host] !== undefined) {
      return this.options.match[host];
    }

    return {};

  }

  /**
   * This method executes the actual fetch() function, but not before adding
   * authentication headers.
   */
  private fetchAuth(request: Request): Promise<Response> {

    const { host } = parse(request.url);
    let authOptions = this.options.auth;
    let authBucket = '*';

    if (this.options.match && host in this.options.match) {
      authBucket = host;
      if (this.options.match[host].auth) {
        authOptions = this.options.match[host].auth;
      }
    }

    if (!authOptions) {
      return fetch(request);
    }

    switch (authOptions.type) {
      case 'basic' :
        request.headers.set('Authorization', 'Basic ' + base64.encode(authOptions.userName + ':' + authOptions.password));
        return fetch(request);
      case 'bearer' :
        request.headers.set('Authorization', 'Bearer ' + authOptions.token);
        return fetch(request);
      case 'oauth2' :
        if (!this.oAuth2Buckets.has(authBucket)) {
          this.oAuth2Buckets.set(
            authBucket,
            new OAuth2(authOptions)
          );
        }
        return this.oAuth2Buckets.get(authBucket).fetch(request);
    }

  }

}

/**
 * Creates a Fetch Request object, based on a number of settings.
 *
 * @param {string|Request} input - Url or input request object.
 * @param {object} init - A list of Fetch settings
 * @param {object} defaultInit - A list of default settings to use if they
 *                              weren't overridden by init.
 * @return {Response}
 */
export function createFetchRequest(input: any, init: any, defaultInit: any): Request {

  const trueInit: any = {};

  if (init) {
    Object.assign(trueInit, defaultInit, init);
  } else {
    Object.assign(trueInit, defaultInit);
  }

  trueInit.headers = mergeHeaders([
    defaultInit ? defaultInit.headers : null,
    // @ts-ignore cross-fetch definitions are broken. See https://github.com/lquixada/cross-fetch/pull/19
    input instanceof Request ? input.headers : null,
    init && init.headers ? init.headers : null
  ]);

    // @ts-ignore cross-fetch definitions are broken. See https://github.com/lquixada/cross-fetch/pull/19
  return new Request(input, trueInit);

}

type HeaderSet = any;


/**
 * 'init' refers to the init argument as passed to Request and Fetch objects.
 *
 * This function takes one or more of those init objects, and merges them.
 * Later properties override earlier ones.
 */
function mergeInit(inits: RequestInit[]) {

  const newHeaders = mergeHeaders(
    inits.map( init => init ? init.headers : null )
  );

  const newInit = Object.assign({}, ...inits);
  newInit.headers = newHeaders;

  return newInit;

}

/**
 * Merges sets of HTTP headers.
 *
 * Each item in the array is a key->value object, a Fetch Headers object
 * or falsey.
 *
 * Any headers that appear more than once get replaced. The last occurence
 * wins.
 */
export function mergeHeaders(headerSets: HeaderSet[]): Headers {

  const result = new Headers();
  for (const headerSet of headerSets) {

    if (headerSet instanceof Headers) {
      for (const key of headerSet.keys()) {
        result.set(key, <string> headerSet.get(key));
      }
    } else if (headerSet) {
      // not falsey, must be a key->value object.
      for (const index of Object.keys(headerSet)) {
        result.set(index, headerSet[index]);
      }
    }
  }

  return result;

}

