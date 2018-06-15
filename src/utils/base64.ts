/**
 * Encoding a string to base64 in node.js
 */
export function encode(input: string): string {

  return new Buffer(input).toString('base64');

}
