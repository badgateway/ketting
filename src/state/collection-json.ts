import { BaseState } from './base-state';
import { parseLink } from '../http/util';
import { Link } from '../link';
import { StateFactory } from './interface';

/**
 * Represents a resource state in the HAL format
 */
export class CjState<T = any> extends BaseState<T> {

  serializeBody(): string {

    throw new Error('Reserializing Collection+JSON states is not yet supported. Please log an issue in the Ketting project to help figure out how this should be done');
  }

}

/**
 * Turns a HTTP response into a CjState
 */
export const factory: StateFactory = async (client, uri, response): Promise<CjState<CjCollection>> => {

  const body = await response.json();

  const links = parseLink(uri, response.headers.get('Link'));
  links.add(
    ...parseCjLinks(uri, body),
  );

  // Remove _links and _embedded from body
  const {
    _embedded,
    _links,
    ...newBody
  } = body;

  return new CjState({
    client,
    uri,
    data: newBody,
    headers: response.headers,
    links,
  });

};

type CjDocument = {
  collection: CjCollection;
};

type CjCollection = {
  version?: string;
  href?: string;
  links?: CjLink[];
  items?: CjItem[];
  queries?: CjQuery[];
  template?: CjTemplate;
  error?: CjError;
};

type CjError = {
  title?: string;
  code?: string;
  message?: string;
};

type CjTemplate = {
  data?: CjProperty[];
};

type CjItem = {
  href?: string;
  data?: CjProperty[];
  links?: CjLink[];
};

type CjProperty = {
  name: string;
  value?: string;
  prompt?: string;
};

type CjQuery = {
  href: string;
  rel: string;
  name?: string;
  prompt?: string;
  data?: CjProperty[];
};

type CjLink = {
  href: string;
  rel: string;
  name?: string;
  render?: 'image' | 'link';
  prompt?: string;
};


function parseCjLinks(contextUri: string, body: CjDocument) {

  const result: Link[] = [];
  if (body.collection.links !== undefined) {

    // Lets start with all links from the links property.
    for (const link of body.collection.links) {
      result.push({
        context: contextUri,
        href: link.href,
        rel: link.rel,
        title: link.name,
      });
    }
  }

  if (body.collection.items !== undefined) {

    // Things that are in the 'items' array should also be considered links
    // with the 'item' link relationship.
    for (const item of body.collection.items) {

      if (!item.href) {
        continue;
      }

      result.push({
        context: contextUri,
        href: item.href,
        rel: 'item',
      });
    }

  }


  if (body.collection.queries !== undefined) {

    // Things that are in the 'queries' array can be considered links too.
    for (const query of body.collection.queries) {

      if (!query.data) {
        // Non-templated
        result.push({
          context: contextUri,
          href: query.href,
          rel: query.rel,
          title: query.name,
        });
      } else {
        // This query has a data property so we need 50% more magic
        result.push({
          context: contextUri,
          href: query.href + query.data.map(
            property => '{?' + property.name + '}'
          ).join(''),
          templated: true,
          rel: query.rel,
          title: query.name,
        });
      }
    }

  }

  return result;

}
