import OAuth2 from 'fetch-mw-oauth2';
import { AuthOptions, KettingInit } from '../types';
import * as base64 from './base64';
import './fetch-polyfill';
import { parse } from './url';

type DomainOptions = {
  fetchInit?: RequestInit,
  auth?: AuthOptions,
  authBucket: string,
};

type beforeRequestCallback = (request: Request) => void;
type afterRequestCallback = (request: Request, response: Response) => void;

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
  private onAfterRequest: afterRequestCallback | null;

  constructor(options: KettingInit, onBeforeRequest: beforeRequestCallback | null = null, onAfterRequest: afterRequestCallback | null = null) {
    this.options = {
      fetchInit: options.fetchInit || {},
      auth: options.auth,
      match: options.match || {},
    };
    this.oAuth2Buckets = new Map();
    this.innerFetch = fetch.bind(global);
    this.onBeforeRequest = onBeforeRequest;
    this.onAfterRequest = onAfterRequest;
  }

  fetch(requestInfo: RequestInfo, requestInit?: RequestInit): Promise<Response> {

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
  async getOptions(): Promise<KettingInit> {

    const options = this.getDomainOptions('*');
    let auth;

    if (options.auth && options.auth.type === 'oauth2') {
      const oauth2 = this.getOAuth2Bucket(options);
      auth = {
        type: 'oauth2' as 'oauth2',
        ...await oauth2.getOptions(),
      };
    } else {
      auth = options.auth;
    }

    return {
      fetchInit: options.fetchInit,
      auth,
    };

  }

  getDomainOptions(uri: string): DomainOptions {

    if (!this.options.match || uri === '*') {
      return {
        fetchInit: this.options.fetchInit,
        auth: this.options.auth,
        authBucket: '*',
      };
    }

    const { host } = parse(uri);
    if (!host) {
      throw new Error('getDomainOptions requires an absolute url');
    }
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
  private async fetchAuth(request: Request): Promise<Response> {

    const options = this.getDomainOptions(request.url);
    const authOptions = options.auth;

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
        if (this.onBeforeRequest) { this.onBeforeRequest(request); }
        const response = await this.getOAuth2Bucket(options).fetch(request);
        if (this.onAfterRequest) { this.onAfterRequest(request, response); }
        return response;
    }


  }

  private getOAuth2Bucket(options: DomainOptions): OAuth2 {

    const authOptions = options.auth;
    if (!authOptions || authOptions.type !== 'oauth2') {
      throw new Error('getOAuth2Bucket can only be called for oauth2 credentials');
    }

    if (!this.oAuth2Buckets.has(options.authBucket)) {
      this.oAuth2Buckets.set(
        options.authBucket,
        new OAuth2(authOptions)
      );
    }
    return this.oAuth2Buckets.get(options.authBucket)!;

  }

  /**
   * This function is the last mile before the actual fetch request is ran
   */
  private async doFetch(request: Request): Promise<Response> {

    if (this.onBeforeRequest) {
      this.onBeforeRequest(request);
    }
    const response = await this.innerFetch(request);
    if (this.onAfterRequest) { this.onAfterRequest(request, response); }
    return response;

  }


}

type HeaderSet = any;


/**
 * 'init' refers to the init argument as passed to Request and Fetch objects.
 *
 * This function takes one or more of those init objects, and merges them.
 * Later properties override earlier ones.
 */
function mergeInit(inits: (RequestInit | undefined)[]) {

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

