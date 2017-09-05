var url = require('url');

module.exports = {

  /**
   * Resolves a relative url using another url.
   *
   * @param {string} base - Base URI
   * @param {string} relative - URI to resolve
   * @returns {string}
   */
  resolve: function(base, relative) {

    return url.resolve(base, relative);

  }

};
