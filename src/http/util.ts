import * as LinkHeader from 'http-link-header';
import { Links } from '../link';

/**
 * Takes a Content-Type header, and only returns the mime-type part.
 */
export function parseContentType(contentType: string | null): string | null {

  if (!contentType) {
    return null;
  }
  if (contentType.includes(';')) {
    contentType = contentType.split(';')[0];
  }
  return contentType.trim();

}


export function parseLink<Rels extends string>(context: string, header: string|null): Links<Rels> {

  const result = new Links<Rels>(context);
  if (!header) {
    return result;
  }

  for (const httpLink of LinkHeader.parse(header).refs) {
    // Looping through individual links
    for (const rel of httpLink.rel.split(' ')) {
      // Looping through space separated rel values.
      const link = {
        rel: rel as Rels,
        href: httpLink.uri,
        context,
        title: httpLink.title,
        hreflang: httpLink.hreflang,
        type: httpLink.type,
      };
      result.add(link);
    }
  }
  return result;
}

const safeMethods = ['GET', 'HEAD', 'OPTIONS', 'PRI', 'PROPFIND', 'REPORT', 'SEARCH', 'TRACE'];

export function isSafeMethod(method: string): boolean {
  return safeMethods.includes(method);
}

/**
 * Older HTTP versions calls these 'entity headers'.
 *
 * Never HTTP/1.1 specs calls some of these 'representation headers'.
 *
 * What they have in common is that these headers can exist on request and
 * response and say something *about* the content.
 */
export const entityHeaderNames = [
  'Content-Type',
  'Content-Language',
  'Content-Location',
  'Deprecation',
  'ETag',
  'Expires',
  'Last-Modified',
  'Sunset',
  'Title',
  'Warning',
];
