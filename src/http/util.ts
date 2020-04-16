/**
 * Takes a Content-Type header, and only returns the mime-type part.
 */
export function parseContentType(contentType: string): string {

  if (contentType.includes(';')) {
    contentType = contentType.split(';')[0];
  }
  return contentType.trim();

}
