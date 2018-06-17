import ClientOAuth2 from 'client-oauth2';
import { Token } from 'client-oauth2';
import fetch from 'cross-fetch';

export type OAuth2Init = {
  client: {
    clientId: string,
    clientSecret: string,
    accessTokenUri: string,
    scopes: string[]
  },
  owner: {
    userName: string,
    password: string,
  }
};

export class OAuth2Helper {

  client: ClientOAuth2
  flow: 'owner'
  token: null | Token 
  owner: {
    userName: string,
    password: string
  }

  constructor(options: OAuth2Init) {

    this.client = new ClientOAuth2(options.client);
    this.token = null;
    this.flow = 'owner';

  }

  /**
   * Does a HTTP request with OAuth2 enabled.
   *
   * This function will automatically grab an access token if it didn't have
   * one, and attempt to refresh the token if it was expired.
   */
  async fetch(request: Request): Promise<Response> {
 
    if (!this.token) {
      await this.getToken();
    }
    request.headers.set('Authorization', 'Bearer ' + this.token.accessToken);
    
    const response = await fetch(request);

    if (response.status !== 401) {
      return response;
    }

    // If we receive 401, refresh token and try again once
    await this.refreshToken();
    request.headers.set('Authorization', 'Bearer ' + this.token.accessToken);

    return fetch(request);

  }

  /**
   * Retrieves an access token and refresh token.
   */
  async getToken() {

    if (this.flow !== 'owner') {
      throw new Error('Unsupported oauth2 flow');
    }

    this.token = await this.client.owner.getToken(
      this.owner.userName,
      this.owner.password
    );

  }

  async refreshToken() {
    await this.token.refresh();
  }

}

/**
 * Fetches an oauth2 token using the owner flow
 *
 * @async
 * @param {object} auth - auth object.
 * @return {object}
 */
  /*function ownerFlow(auth) {
  return auth.oauth.client.owner.getToken(
    auth.owner.userName,
    auth.owner.password
  )
    .then(function (token) {
      auth.oauth.token = token;
      return;
    });
}

/**
 * Makes a request using OAuth2 when we have a token already.
 *
 * If the initial request fails with a 401 error, we assume the token headers
 * expired. We refresh the token and attempt the request one more time.
 *
 * @async
 * @param {object} ketting - Ketting object.
 * @param {Request} request - Request object.
 * @param {object} init - A list of settings.
 * @return {object}
 */
  /*function fetchWithAccessToken(ketting, request) {
  request.headers.set('Authorization', 'Bearer ' + ketting.auth.oauth.token.accessToken);

  return fetch(request)
    .then(function(response) {
      // If we receive 401, refresh token and try again once
      if (!response.ok && response.status === 401) {
        return ketting.auth.oauth.refreshToken(ketting)
          .then(function() {
            request.headers.set('Authorization', 'Bearer ' + ketting.auth.oauth.token.accessToken);
            return fetch(request);
          });
      }

      return response;
    });
}

//module.exports = {
  /**
   * Makes a request using OAuth2
   *
   * @async
   * @param {object} ketting - Ketting object.
   * @param {Request} request - Request object.
   * @return {object}
   */
  /*(fetch : function(ketting, request) {
    if (ketting.auth.oauth.token) {
      return fetchWithAccessToken(ketting, request);
    }

    return ketting.auth.oauth.getToken()
      .then(function () {
        // Just call the ketting function again now that we have an access token
        request.headers.set('Authorization', 'Bearer ' + ketting.auth.oauth.token.accessToken);
        return fetch(request);
      });
  },

  /**
   * Fetches an oauth2 token and sets it on the given auth object
   *
   * @async
   * @param {object} auth - Auth object.
   * @return {object}
   */
  /*getToken : function(auth) {
    if (auth.oauth.flow === 'owner') {
      return ownerFlow(auth);
    }

    throw new Error('Unsupported oauth2 flow');
  },


  /**
   * Refreshes the access token and updates the existing token with the new one
   *
   * @async
   * @param {object} auth - Auth object.
   * @return {object}
   */
  /*refreshToken : function(auth) {
    return auth.oauth.token.refresh()
      .then(function(updatedToken) {
        auth.oauth.token = updatedToken;
        return;
      });
  },

  /**
   * Sets up the oauth object that will be part of the overall
   * Ketting object
   *
   * @param {object} ketting - Ketting object.
   * @param {object} auth - Auth options object
   * @return {object}
   */
  /*setupOAuthObject : function(ketting, auth) {
    var oauth = this;
    var oAuthObject = {
      client: new ClientOAuth2(auth.client),
      getToken: function() {
        return oauth.getToken(ketting.auth);
      },
      refreshToken: function() {
        return oauth.refreshToken(ketting.auth);
      }
    };

    if (auth.owner) {
      oAuthObject.flow = 'owner';
    }

    return oAuthObject;
  }
};*/
