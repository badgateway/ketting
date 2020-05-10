import * as sax from 'sax';
import { Link } from '../link';

export function parseHtmlLinks(contextUri: string, body: string): Link[] {

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

      const type = <string>node.attributes.TYPE;
      const link: Link = {
        rel,
        context: contextUri,
        href: <string> node.attributes.HREF,
      };
      if (type) link.type = type;
      links.push(link);

    }

  };

  parser.write(body).close();

  return links;

}
