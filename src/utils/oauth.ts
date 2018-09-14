import ClientOAuth2 from 'client-oauth2';
import { Token } from 'client-oauth2';
import './fetch-polyfill';

export type OAuth2Init = {
  client: {
    clientId: string,
    clientSecret: string,
    accessTokenUri: string,
    scopes: string[]
  },
  owner: {
    userName: string,
    password: string
  }
};

export class OAuth2Helper {

  client: ClientOAuth2;
  token: null | Token;
  owner: {
    userName: string,
    password: string
  };

  constructor(options: OAuth2Init) {

    this.client = new ClientOAuth2(options.client);
    this.token = null;

    if (options.owner === undefined) {
      throw new Error('Unsupported oauth2 flow. Only the "owner" flow is currently supported.');
    }

    this.owner = options.owner;

  }

  /**
   * Does a HTTP request with OAuth2 enabled.
   *
   * This function will automatically grab an access token if it didn't have
   * one, and attempt to refresh the token if it was expired.
   */
  async fetch(request: Request): Promise<Response> {

    const token = await this.getToken();
    request.headers.set('Authorization', 'Bearer ' + token.accessToken);

    const response = await fetch(request);

    if (response.status !== 401) {
      return response;
    }

    // If we receive 401, refresh token and try again once
    this.token = await this.token.refresh();
    request.headers.set('Authorization', 'Bearer ' + this.token.accessToken);

    return fetch(request);

  }

  /**
   * Retrieves an access token and refresh token.
   */
  async getToken(): Promise<Token> {

    if (!this.token) {
      this.token = await this.client.owner.getToken(
        this.owner.userName,
        this.owner.password
      );
    }
    return this.token;

  }

}
