/**
 * Encoding a string to base64 in node.js
 */

module.exports = {

  /**
   * Encodes a string as base64
   */
  encode : function(string) {

    return new Buffer(string).toString('base64');

  }
};
