/**
 * Encoding a string to base64 in node.js
 */
export default {

  /**
   * Encodes a string as base64
   */
  encode : function(input: string): string {

    return new Buffer(input).toString('base64');

  }
};
