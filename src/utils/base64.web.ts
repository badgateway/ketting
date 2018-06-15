/**
 * Encoding a string to base64 in a browser.
 */
export default { 

  /**
   * Encodes a string as base64
   */
  encode : function(input: string): string {

    return btoa(input);

  }
};
