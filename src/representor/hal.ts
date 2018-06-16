import Representation from './base';
import Link from '../link';
import { resolve } from '../utils/url';

/**
 * The Representation class is basically a 'body' of a request
 * or response.
 *
 * This class is for HAL JSON responses.
 */
export default class Hal extends Representation {

  body: { [s: string]: any }

  constructor(uri: string, contentType: string, body: any) {

    super(uri, contentType, body);

    if (typeof body === 'string') {
      this.body = JSON.parse(body);
    } else {
      this.body = body;
    }

    if (typeof this.body._links !== 'undefined') {
      parseHalLinks(this);
    }
    if (typeof this.body._embedded !== 'undefined') {
      parseHalEmbedded(this);
    }

    delete this.body._links;
    delete this.body._embedded;

  }

}

/**
 * Parse the Hal _links object and populate the 'links' property.
 */
const parseHalLinks = function(representation: Hal): void {

  for(const relType of Object.keys((<any>representation.body)._links)) {

    let links = (<any>representation.body)._links[relType];
    if (!Array.isArray(links)) {
      links = [links];
    }
    parseHalLink(representation, relType, links);

  }

};

type HalLink = {
  href: string,
  name?: string,
  templated?: boolean,
  type?: string
};

/**
 * Parses a single HAL link from a _links object, or a list of links.
 */
const parseHalLink = function(representation: Hal, rel: string, links: HalLink[]): void {

  for(const link of links) {
    representation.links.push(
      new Link({
        rel: rel,
        baseHref: representation.uri,
        href: link.href,
        type: link.type,
        templated: link.templated,
        name: link.name
      })
    );
  }

};

/**
 * Parse the HAL _embedded object. Right now we're just grabbing the
 * information from _embedded and turn it into links.
 */
const parseHalEmbedded = function(representation: Hal): void {

  for(const relType of Object.keys((<any>representation).body._embedded)) {

    let embedded = (<any>representation).body._embedded[relType];
    if (!Array.isArray(embedded)) {
      embedded = [embedded];
    }
    for(const embeddedItem of embedded) {

      const uri = resolve(
        representation.uri,
        embeddedItem._links.self.href
      );

      representation.links.push(
        new Link({
          rel: relType,
          baseHref: representation.uri,
          href: embeddedItem._links.self.href
        })
      );

      representation.embedded[uri] = embeddedItem;

    }
  }
};
