import OAuth2 from 'fetch-mw-oauth2';
import { AuthOptions, KettingInit } from '../types';
import * as base64 from './base64';
import './fetch-polyfill';
import { parse } from './url';

type DomainOptions = {
  fetchInit: RequestInit,
  auth: AuthOptions,
  authBucket: string,
};

type beforeRequestCallback = (request: Request) => void;

/**
 * This class is primarily responsible for calling fetch().
 *
 * It's main purpose besides that is to add authentication headers, and
 * any defaults that might have been set.
 */
export default class FetchHelper {

  private options: KettingInit;
  private oAuth2Buckets: Map<string, OAuth2>;
  private innerFetch: typeof fetch;
  private onBeforeRequest: beforeRequestCallback | null;

  constructor(options: KettingInit, onBeforeRequest: beforeRequestCallback | null = null) {
    this.options = options;
    this.oAuth2Buckets = new Map();
    this.innerFetch = fetch.bind(global);
    this.onBeforeRequest = onBeforeRequest;
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

  getDomainOptions(uri: string): DomainOptions {

    if (!this.options.match) {
      return {
        fetchInit: this.options.fetchInit,
        auth: this.options.auth,
        authBucket: '*',
      };
    }

    const { host } = parse(uri);
    for (const [matchStr, options] of Object.entries(this.options.match)) {

      const matchSplit = matchStr.split('*');
      const matchRegex = matchSplit.map(
        part =>
        part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      ).join('(.*)');

      if (new RegExp('^' + matchRegex + '$').test(host)) {

        return {
          fetchInit: options.fetchInit,
          auth: options.auth || this.options.auth,
          authBucket: matchStr
        };
      }

    }
    return {
      fetchInit: this.options.fetchInit,
      auth: this.options.auth,
      authBucket: '*',
    };

  }

  /**
   * This method executes the actual fetch() function, but not before adding
   * authentication headers.
   */
  private fetchAuth(request: Request): Promise<Response> {

    const options = this.getDomainOptions(request.url);
    const authOptions = options.auth;
    const authBucket = options.authBucket;

    if (!authOptions) {
      return this.doFetch(request);
    }

    switch (authOptions.type) {
      case 'basic' :
        request.headers.set('Authorization', 'Basic ' + base64.encode(authOptions.userName + ':' + authOptions.password));
        return this.doFetch(request);
      case 'bearer' :
        request.headers.set('Authorization', 'Bearer ' + authOptions.token);
        return this.doFetch(request);
      case 'oauth2' :
        if (!this.oAuth2Buckets.has(authBucket)) {
          this.oAuth2Buckets.set(
            authBucket,
            new OAuth2(authOptions)
          );
        }
        if (this.onBeforeRequest) { this.onBeforeRequest(request); }
        return this.oAuth2Buckets.get(authBucket).fetch(request);
    }


  }

  /**
   * This function is the last mile before the actual fetch request is ran
   */
  private doFetch(request: Request): Promise<Response> {

    if (this.onBeforeRequest) {
      this.onBeforeRequest(request);
    }
    return this.innerFetch(request);

  }


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

