import { OAuth2Options } from 'fetch-mw-oauth2';

export type ContentType = {
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
} & OAuth2Options;

export type AuthOptions =
  AuthOptionsBasic |
  AuthOptionsBearer |
  AuthOptionsOAuth2;

export type KettingInit = {

  /**
   * Authentication options.
   */
  auth?: AuthOptions

  /**
   * A list of settings passed to the Fetch API.
   *
   * It's effectively a list of defaults that are passed as the 'init' argument.
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Request/Request
   */
  fetchInit?: RequestInit,

  /**
   * Per-domain options.
   *
   * This setting allows you to override specific options on a per-domain
   * basis. It's possible to specify wildcards here.
   */
  match?: {
    [domain: string]: {
      auth?: AuthOptions
      fetchInit?: RequestInit,
    }
  }
};

export type NormalizedOptions = {

  /**
   * Authentication options.
   */
  auth?: AuthOptions

  /**
   * A list of settings passed to the Fetch API.
   *
   * It's effectively a list of defaults that are passed as the 'init' argument.
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Request/Request
   */
  fetchInit?: RequestInit,


};
