import Link from '../link';
import Representation from './base';

/**
 * The Representation class is basically a 'body' of a request
 * or response.
 *
 * This class is for HTML responses. The html.web.js version is the version
 * intended for browsers. The regular html.js is intended for node.js.
 */
export default class Html extends Representation<string> {

  /**
   * Parse links.
   *
   * This function gets called once by this object to parse any in-document
   * links.
   */
  protected parseLinks(body: string): Link[] {

    const parser = new DOMParser();
    const doc = parser.parseFromString(body, 'text/html');

    linkFromTags(
      this.uri,
      doc.getElementsByTagName('link')
    );

    linkFromTags(
      this.uri,
      doc.getElementsByTagName('a')
    );

    return [];

  }

  /**
   * parse is called to convert a HTTP response body string into the most
   * suitable internal body type.
   *
   * For HTML, we are keeping the response as a string instead of returning
   * for example a DOM.
   */
  protected parse(body: string): string {

    return body;

  }

}

function linkFromTags(contextUri: string, elements: HTMLCollectionOf<HTMLElement>): Link[] {

  const result:Link[] = [];

  for (const node of elements) {

    const rels = node.getAttribute('rel');
    const href = node.getAttribute('href');
    const type = node.getAttribute('type') || undefined;

    if (!rels || !href) {
      continue;
    }

    for (const rel of rels.split(' ')) {

      const link = new Link({
        rel: rel,
        context: contextUri,
        href: href,
        type: type
      });
      result.push(link);

    }

  }
  return result;

}
