/**
 * Encoding a string to base64 in node.js
 */

module.exports = {

  /**
   * Encodes a string as base64
   *
   * @param {string} string
   * @returns {string}
   */
  encode : function(string) {

    return btoa(string);

  }
};
