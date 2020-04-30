import * as sax from 'sax';
import { Link, Links } from '../link';

export function parseHtmlLinks(contextUri: string, body: string): Link[] {

  const parser = new DOMParser();
  const doc = parser.parseFromString(body, 'text/html');

  return [
    ...linkFromTags(
      contextUri,
      doc.getElementsByTagName('link')
    ),
    ...linkFromTags(
      contextUri,
      doc.getElementsByTagName('a')
    )
  ];

  return [];


}

function linkFromTags(contextUri: string, elements: HTMLCollectionOf<HTMLElement>): Link[] {

  const result: Link[] = [];

  for (const node of elements) {

    const rels = node.getAttribute('rel');
    const href = node.getAttribute('href');
    const type = node.getAttribute('type') || undefined;

    if (!rels || !href) {
      continue;
    }

    for (const rel of rels.split(' ')) {

      const link = {
        rel: rel,
        context: contextUri,
        href: href,
        type: type
      };
      result.push(link);

    }

  }
  return result;

}
