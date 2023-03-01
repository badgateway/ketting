import { FetchMiddleware } from './fetcher';
import { OAuth2Client, OAuth2Fetch } from '@badgateway/oauth2-client';

function oauth2mw(oauth2Options: OAuth2Options, token?: OAuth2Token): FetchMiddleware {

  console.warn('The OAuth2 middleware in Ketting is deprecated, and will be removed in the next major version of Ketting. You should upgrade to the OAuth2Fetch from the @badgateway/oauth2-client project');

  // This code converts the old 'fetch-mw-oauth2' options format to the new
  // oauth2 client we use now, which is why it's a bit clunky.
  const newOptions: ConstructorParameters<typeof OAuth2Client>[0] = {
    clientId: oauth2Options.clientId,
    clientSecret: 'clientSecret' in oauth2Options ? oauth2Options.clientSecret : undefined,
    tokenEndpoint: oauth2Options.tokenEndpoint,
  };


  const oauth2Client = new OAuth2Client(newOptions);
  const oauth2Fetch = new OAuth2Fetch({
    client: oauth2Client,
    getNewToken: async() => {

      switch(oauth2Options.grantType) {
        case 'password' :
          return oauth2Client.password({
            username: oauth2Options.userName,
            password: oauth2Options.password,
            scope: oauth2Options.scope,
          });
        case 'client_credentials' :
          return oauth2Client.clientCredentials({
            scope: oauth2Options.scope
          });
        case 'authorization_code' :
          return oauth2Client.authorizationCode.getToken({
            code: oauth2Options.code,
            codeVerifier: oauth2Options.codeVerifier,
            redirectUri: oauth2Options.redirectUri,
          });
        case undefined:
          return null;
      }

    },

    getStoredToken: (): OAuth2Token|null => {
      return token ?? null;
    },

    storeToken: (token: OAuth2Token) => {
      if (oauth2Options.onTokenUpdate) {
        oauth2Options.onTokenUpdate(token);
      }
    },

    onError: (err: Error) => {
      if (oauth2Options.onAuthError) {
        oauth2Options.onAuthError(err);
      }
    }
  });



  return oauth2Fetch.mw();
}


export default oauth2mw;

/**
 * Token information
 */
export type OAuth2Token = {

  /**
   * OAuth2 Access Token
   */
  accessToken: string;

  /**
   * When the Access Token expires.
   *
   * This is expressed as a unix timestamp in milliseconds.
   */
  expiresAt: number | null;

  /**
   * OAuth2 refresh token
   */
  refreshToken: string | null;
};

/**
 * grant_type=password
 */
type PasswordGrantOptions = {
  grantType: 'password';

  /**
   * OAuth2 client id
   */
  clientId: string;

  /**
   * OAuth2 Client Secret
   */
  clientSecret: string;

  /**
   * OAuth2 token endpoint
   */
  tokenEndpoint: string;

  /**
   * List of OAuth2 scopes
   */
  scope?: string[];

  /**
   * Username to log in as
   */
  userName: string;

  /**
   * Password
   */
  password: string;

  /**
   * Callback to trigger when a new access/refresh token pair was obtained.
   */
  onTokenUpdate?: (token: OAuth2Token) => void;

  /**
   * If authentication fails without a chance of recovery, this gets triggered.
   *
   * This is used for example when your resource server returns a 401, but only after
   * other attempts have been made to reauthenticate (such as a token refresh).
   */
  onAuthError?: (error: Error) => void;
};

/**
 * grant_type=client_credentials
 */
type ClientCredentialsGrantOptions = {
  grantType: 'client_credentials';

  /**
   * OAuth2 client id
   */
  clientId: string;

  /**
   * OAuth2 Client Secret
   */
  clientSecret: string;

  /**
   * OAuth2 token endpoint
   */
  tokenEndpoint: string;

  /**
   * List of OAuth2 scopes
   */
  scope?: string[];

  /**
   * Callback to trigger when a new access/refresh token pair was obtained.
   */
  onTokenUpdate?: (token: OAuth2Token) => void;

  /**
   * If authentication fails without a chance of recovery, this gets triggered.
   *
   * This is used for example when your resource server returns a 401, but only after
   * other attempts have been made to reauthenticate (such as a token refresh).
   */
  onAuthError?: (error: Error) => void;
};

/**
 * grant_type=authorization_code
 */
type AuthorizationCodeGrantOptions = {
  grantType: 'authorization_code';

  /**
   * OAuth2 client id
   */
  clientId: string;

  /**
   * OAuth2 token endpoint
   */
  tokenEndpoint: string;

  /**
   * The redirect_uri that was passed originally to the 'authorization' endpoint.
   *
   * This must be identical to the original string, as conforming OAuth2 servers
   * will validate this.
   */
  redirectUri: string;

  /**
   * Code that was obtained from the authorization endpoint
   */
  code: string;

  /**
   * Callback to trigger when a new access/refresh token pair was obtained.
   */
  onTokenUpdate?: (token: OAuth2Token) => void;

  /**
   * If authentication fails without a chance of recovery, this gets triggered.
   *
   * This is used for example when your resource server returns a 401, but only after
   * other attempts have been made to reauthenticate (such as a token refresh).
   */
  onAuthError?: (error: Error) => void;

  /**
   * When using PKCE, specify the previously generated code verifier here.
   */
  codeVerifier?: string;
};

/**
 * In case you obtained an access token and/or refresh token through different
 * means, you can not specify a grant_type and simply only specify an access
 * and refresh token.
 *
 * If a refresh or tokenEndpoint are not supplied, the token will never get refreshed.
 */
type RefreshOnlyGrantOptions = {
  grantType: undefined;

  /**
   * OAuth2 client id
   */
  clientId: string;
  tokenEndpoint: string;

  /**
   * Callback to trigger when a new access/refresh token pair was obtained.
   */
  onTokenUpdate?: (token: OAuth2Token) => void;

  /**
   * If authentication fails without a chance of recovery, this gets triggered.
   *
   * This is used for example when your resource server returns a 401, but only after
   * other attempts have been made to reauthenticate (such as a token refresh).
   */
  onAuthError?: (error: Error) => void;
};

export type OAuth2Options =
  PasswordGrantOptions | ClientCredentialsGrantOptions | AuthorizationCodeGrantOptions | RefreshOnlyGrantOptions;
