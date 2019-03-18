import { OAuth2, OAuth2Options } from 'fetch-mw-oauth2';
import './fetch-polyfill';

export type OAuth2Init = {
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

export class OAuth2Helper {

  oauth2: OAuth2;

  constructor(options: OAuth2Init) {

    let oauth2Options: OAuth2Options;

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
