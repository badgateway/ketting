import Link from '../link';
import Representation from './base';

type CjDocument = {
  collection: CjCollection,
};

type CjCollection = {
  version?: string,
  href?: string,
  links?: CjLink[],
  items?: CjItem[],
  queries?: CjQuery[],
  template?: CjTemplate,
  error?: CjError
};

type CjError = {
  title?: string,
  code?: string,
  message?: string,
};

type CjTemplate = {
  data?: CjProperty[]
};

type CjItem = {
  href?: string,
  data?: CjProperty[],
  links?: CjLink[],
};

type CjProperty = {
  name: string,
  value?: string,
  prompt?: string
};

type CjQuery = {
  href: string,
  rel: string,
  name?: string,
  prompt?: string,
  data?: CjProperty[]
};

type CjLink = {
  href: string,
  rel: string,
  name?: string,
  render?: 'image' | 'link',
  prompt?: string
};

/**
 * The Representation class is basically a 'body' of a request
 * or response.
 *
 * This class is for the Collection+JSON format, defined here:
 *
 * http://amundsen.com/media-types/collection/format/#object-collection
 */
export default class CollectionJson extends Representation<CjDocument> {

  parse(body: string): CjDocument  {

    return JSON.parse(body);

  }

  parseLinks(body: CjDocument): Link[] {

    const result: Link[] = [];
    if (body.collection.links !== undefined) {

      // Lets start with all links from the links property.
      for (const link of body.collection.links) {
        result.push(new Link({
          context: this.uri,
          href: link.href,
          rel: link.rel,
          title: link.name,
        }));
      }
    }

    if (body.collection.items !== undefined) {

      // Things that are in the 'items' array should also be considered links
      // with the 'item' link relationship.
      for (const item of body.collection.items) {

        if (!item.href) {
          continue;
        }

        result.push(new Link({
          context: this.uri,
          href: item.href,
          rel: 'item',
        }));
      }

    }


    if (body.collection.queries !== undefined) {

      // Things that are in the 'queries' array can be considered links too.
      for (const query of body.collection.queries) {

        if (!query.data) {
          // Non-templated
          result.push(new Link({
            context: this.uri,
            href: query.href,
            rel: query.rel,
            title: query.name,
          }));
        } else {
          // This query has a data property so we need 50% more magic
          result.push(new Link({
            context: this.uri,
            href: query.href + query.data.map(
              property => '{?' + property.name + '}'
            ).join(''),
            templated: true,
            rel: query.rel,
            title: query.name,
          }));
        }
      }

    }

    return result;

  }

}
