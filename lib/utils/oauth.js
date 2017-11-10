var ClientOAuth2 = require('client-oauth2');

var fetch = require('./fetch');

/**
 * Fetches an oauth2 token using the owner flow
 *
 * @async
 * @param {object} auth - auth object.
 * @return {object}
 */
function ownerFlow(auth) {
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
function fetchWithAccessToken(ketting, request, init) {
  request.headers.set('Authorization', 'Bearer ' + ketting.auth.oauth.token.accessToken);

  return fetch(request, init)
    .then(function(response) {
      // If we receive 401, refresh token and try again once
      if (!response.ok && response.status === 401) {
        return ketting.auth.oauth.refreshToken(ketting)
          .then(function() {
            request.headers.set('Authorization', 'Bearer ' + ketting.auth.oauth.token.accessToken);
            return fetch(request, init);
          });
      }

      return response;
    });
}

module.exports = {
  /**
   * Makes a request using OAuth2
   *
   * @async
   * @param {object} ketting - Ketting object.
   * @param {Request} request - Request object.
   * @param {object} init - A list of settings.
   * @return {object}
   */
  fetch : function(ketting, request, init) {
    if (ketting.auth.oauth.token) {
      return fetchWithAccessToken(ketting, request, init);
    }

    return this.getToken(ketting.auth)
      .then(function () {
        // Just call the ketting function again now that we have an access token
        return fetch(request, init);
      });
  },

  /**
   * Fetches an oauth2 token and sets it on the given auth object
   *
   * @async
   * @param {object} auth - Auth object.
   * @return {object}
   */
  getToken : function(auth) {
    if (auth.oauth.flow === 'owner') {
      return ownerFlow(auth);
    }

    throw new Error('Unsupported oauth2 flow');
  },

  refreshToken : function(ketting) {
    return ketting.auth.oauth.token.refresh()
      .then(function(updatedToken) {
        ketting.auth.oauth.token = updatedToken;
        return;
      });
  },

  /**
   * Sets up the oauth object that will be part of the overall
   * Ketting object
   *
   * @param {object} auth - Auth options object
   * @return {object}
   */
  setupOAuthObject : function(auth) {
    var oAuthObject = {
      client: new ClientOAuth2(auth.client),
      getToken: this.getToken,
      refreshToken: this.refreshToken
    };

    if (auth.owner) {
      oAuthObject.flow = 'owner';
    }

    return oAuthObject;
  }
};
