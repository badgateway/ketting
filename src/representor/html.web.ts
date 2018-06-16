import Representation from './base';
import Link from '../link';

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

    const parser = new DOMParser();
    const doc = parser.parseFromString(body, 'text/html');

    linkFromTags(
      this,
      doc.getElementsByTagName('link')
    );

    linkFromTags(
      this,
      doc.getElementsByTagName('a')
    );

  }

};

function linkFromTags(htmlDoc: Html, elements: NodeListOf<HTMLElement>) {

  for(const node of elements) {

    const rels = node.getAttribute('rel');
    const href = node.getAttribute('href');
    const type = node.getAttribute('type');

    if (!rels || !href) {
      continue;
    }

    for(const rel of rels.split(' ')) {

      const link = new Link({
        rel: rel,
        baseHref: htmlDoc.uri,
        href: href,
        type: type
      });
      htmlDoc.links.push(link);

    }

  }

}
