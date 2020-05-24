import { Link } from '../link';
import { resolve } from './uri';

type ParseHtmlResult = {

  links: Link[],
  forms: Array<{
    action: string,
    method: string,
    enctype: string | null,
    rel: string | null,
    id: string | null,
  }>;

}
export function parseHtml(contextUri: string, body: string): ParseHtmlResult {

  const parser = new DOMParser();
  const doc = parser.parseFromString(body, 'text/html');

  return {
    forms: formFromTags(
      contextUri,
      doc.getElementsByTagName('form')
    ),
    links: [
      ...linkFromTags(
        contextUri,
        doc.getElementsByTagName('link')
      ),
      ...linkFromTags(
        contextUri,
        doc.getElementsByTagName('a')
      )
   ]
  };

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

      const link:Link = {
        rel: rel,
        context: contextUri,
        href: href,
      };
      if (type) link.type = type;
      result.push(link);

    }

  }
  return result;

}

function formFromTags(contextUri: string, elements: HTMLCollectionOf<HTMLFormElement>): ParseHtmlResult['forms'] {

  const result = [];

  for (const node of elements) {

    const rels = node.getAttribute('rel');
    const action = node.getAttribute('action')!;
    const enctype = node.getAttribute('enctype') || 'application/x-www-form-urlencoded';
    const id = node.getAttribute('id');
    const method = node.getAttribute('method') || 'GET';

    if (!rels) {
      result.push({
        rel: null,
        action: resolve(contextUri, action),
        enctype,
        id,
        method
      });
      continue;
    }

    for (const rel of rels.split(' ')) {

      const form = {
        rel,
        action: resolve(contextUri, action),
        enctype,
        id,
        method
      }
      result.push(form);

    }

  }
  return result;

}
