import * as sax from 'sax';
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

    const parser = sax.parser(false, {});
    const links: Link[] = [];

    parser.onopentag = node => {

      if (!node.attributes.REL) {
        return;
      }
      if (!node.attributes.HREF) {
        return;
      }

      const rels = <string> node.attributes.REL;

      for (const rel of rels.split(' ')) {

        const link = new Link({
          rel: rel,
          context: this.uri,
          href: <string> node.attributes.HREF,
          type: <string> node.attributes.TYPE || undefined
        });
        links.push(link);

      }

    };

    parser.write(body).close();

    return links;

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
