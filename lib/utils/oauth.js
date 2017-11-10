var ClientOAuth2 = require('client-oauth2');

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

module.exports = {
  /**
   * Fetches an oauth2 token and sets it on the given auth object
   *
   * @async
   * @param {object} auth - Auth object.
   * @return {object}
   */
  getToken: function(auth) {
    if (auth.oauth.flow === 'owner') {
      return ownerFlow(auth);
    }

    throw new Error('Unsupported oauth2 flow');
  },

  refreshToken: function(ketting) {
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
   * @param {object} ketting - Ketting object.
   * @param {object} auth - Auth options object
   * @return {object}
   */
  setupOAuthObject: function(ketting, auth) {
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
