module.exports = {
  /**
   * Fetches an oauth2 token and sets it on the given ketting class
   *
   * @async
   * @param {object} ketting - Ketting object.
   * @return {object}
   */
  fetchToken: function(ketting) {
    if (ketting.auth.owner) {
      return this.ownerFlow(ketting);
    }
  },

  /**
   * Fetches an oauth2 token using the owner flow
   *
   * @async
   * @param {object} ketting - Ketting object.
   * @return {object}
   */
  ownerFlow: function(ketting) {
    return ketting.auth.oauthClient.owner.getToken(
      ketting.auth.owner.userName,
      ketting.auth.owner.password
    )
      .then(function (client) {
        ketting.auth['accessToken'] = client.accessToken;
        ketting.auth['refreshToken'] = client.refreshToken;
        return ketting;
      });
  }
};
