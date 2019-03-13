import { default as OAuth2, OAuth2Options } from 'fetch-mw-oauth2';
import './fetch-polyfill';

/**
 * This options format exists for backwards compatibility.
 *
 * The currect new format is 'OAuth2Options'.
 *
 * See the fetch-mw-oauth2 project for details:
 * https://github.com/evert/fetch-mw-oauth2
 */
export type BCOAuth2Options = {
  client: {
    clientId: string,
    clientSecret: string,
    accessTokenUri: string,
    scopes: string[]
  },
  owner?: {
    userName: string,
    password: string
  }
};

export type OAuth2Init =  (BCOAuth2Options | OAuth2Options);

export class OAuth2Helper {

  oauth2: OAuth2;

  constructor(options: OAuth2Init) {

    let oauth2Options: OAuth2Options;

    if (isOldOptionsFormat(options)) {
      // These are the 'old style' settings and exist for compatibility
      if (options.owner) {
        oauth2Options = {
          grantType: 'password',
          tokenEndpoint: options.client.accessTokenUri,
          clientId : options.client.clientId,
          clientSecret: options.client.clientSecret,
          userName: options.owner.userName,
          password: options.owner.password,
        };
      } else {
        oauth2Options = {
          grantType: 'client_credentials',
          tokenEndpoint: options.client.accessTokenUri,
          clientId : options.client.clientId,
          clientSecret: options.client.clientSecret,
        };
      }
    } else {
      // New setting format
      oauth2Options = options;
    }
    this.oauth2 = new OAuth2(oauth2Options);

  }

  /**
   * Does a HTTP request with OAuth2 enabled.
   *
   * This function will automatically grab an access token if it didn't have
   * one, and attempt to refresh the token if it was expired.
   */
  async fetch(request: Request): Promise<Response> {

    return this.oauth2.fetch(request);

  }

}

function isOldOptionsFormat(options: OAuth2Init): options is BCOAuth2Options {

  return (<BCOAuth2Options> options).client !== undefined;

}
