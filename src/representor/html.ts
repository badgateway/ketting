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
export default class Html extends Representation {

  constructor(uri: string, contentType: string, body: string) {

    super(uri, contentType, body);

    const parser = sax.parser(false, {});

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
          baseHref: this.uri,
          href: <string> node.attributes.HREF,
          type: <string> node.attributes.TYPE || undefined
        });
        this.links.push(link);

      }

    };

    parser.write(body).close();

  }

}
