/**
 * Encoding a string to base64 in node.js
 */
export function encode(input: string): string {

  return Buffer.from(input).toString('base64');

}
