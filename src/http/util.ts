import * as LinkHeader from 'http-link-header';
import { Link, Links } from '../link';

/**
 * Takes a Content-Type header, and only returns the mime-type part.
 */
export function parseContentType(contentType: string): string {

  if (contentType.includes(';')) {
    contentType = contentType.split(';')[0];
  }
  return contentType.trim();

}


export function parseLink(header: string|null): Links {

  const result = new Links();
  if (!header) {
    return result;
  }

  for (const httpLink of LinkHeader.parse(header).refs) {
    // Looping through individual links
    for (const rel of httpLink.rel.split(' ')) {
      // Looping through space separated rel values.
      const link = {
        rel: rel,
        href: httpLink.uri,
        title: httpLink.title,
      };
      result.add(link);
    }
  }
  return result;
}

