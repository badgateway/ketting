import Link from '../link';
import { resolve } from '../utils/url';
import Representation from './base';

type HalLink = {
  href: string,
  name?: string,
  title: string,
  templated?: boolean,
  type?: string
};

type HalBody = {
  _links?: {
    [rel: string]: HalLink | HalLink[],
  }
  [key: string]: any,
  _embedded?: {
    [rel: string]: HalBody | HalBody[],
  }
};

/**
 * Internal representation for embedded resources
 */
type Embedded = {
  href: string,
  contextUri: string,
  rel: string,
  body: HalBody
};

/**
 * The Representation class is basically a 'body' of a request
 * or response.
 *
 * This class is for HAL JSON responses.
 */
export default class Hal extends Representation<HalBody> {

  embedded: Embedded[];

  /**
   * parse is called to convert a HTTP response body string into the most
   * suitable internal body type.
   *
   * For JSON responses, usually this means calling JSON.parse() and returning
   * the result.
   */
  parse(body: string): HalBody {

    return JSON.parse(body);

  }

  parseLinks(body: HalBody): Link[] {

    return parseHalLinks(this.uri, body);

  }

  /**
   * Returns the parsed body for this representation.
   *
   * Specific implementations of this class might alter the response before
   * returning, for example to remove meta-information that's not relevant
   * the user of this object.
   */
  getBody(): HalBody {

    const {
      _embedded,
      _links,
      ...newBody
    } = this.body;

    return newBody;

  }

  getEmbedded(): { [uri: string]: HalBody } {

    const result: { [uri: string]: HalBody } = {};
    for (const embedded of parseHalEmbedded(this.uri, this.body)) {
      result[resolve(this.uri, embedded.href)] = embedded.body;
    }
    return result;

  }
}

/**
 * Parse the Hal _links object and populate the 'links' property.
 */
function parseHalLinks(contextUri: string, body: HalBody): Link[] {

  if (body._links === undefined) {
    return [];
  }

  const result: Link[] = [];

  for (const [relType, links] of Object.entries(body._links)) {

    const linkList = Array.isArray(links) ? links : [links];

    result.push(
      ...parseHalLink(contextUri, relType, linkList)
    );

  }

  const embedded = parseHalEmbedded(contextUri, body);

  for (const embeddedItem of embedded) {

    result.push(new Link({
      rel: embeddedItem.rel,
      href: embeddedItem.href,
      context: embeddedItem.contextUri,
    }));

  }

  return result;

}


/**
 * Parses a single HAL link from a _links object, or a list of links.
 */
function parseHalLink(contextUri: string, rel: string, links: HalLink[]): Link[] {

  const result: Link[] = [];

  for (const link of links) {
    result.push(
      new Link({
        rel: rel,
        context: contextUri,
        href: link.href,
        title: link.title,
        type: link.type,
        templated: link.templated,
        name: link.name
      })
    );
  }

  return result;

}

/**
 * Parse the HAL _embedded object. Right now we're just grabbing the
 * information from _embedded and turn it into links.
 */
function parseHalEmbedded(contextUri: string, body: HalBody): Embedded[] {

  if (body._embedded === undefined) {
    return [];
  }

  const result: Embedded[] = [];

  for (const [rel, embedded] of Object.entries(body._embedded)) {

    let embeddedList: HalBody[] = [];

    if (!Array.isArray(embedded)) {
      embeddedList = [embedded];
    } else {
      embeddedList = embedded;

    }
    for (const embeddedItem of embeddedList) {

      if (embeddedItem._links === undefined || embeddedItem._links.self === undefined || Array.isArray(embeddedItem._links.self)) {
        // Skip any embedded without a self link.
        continue;
      }

      result.push({
        rel,
        contextUri,
        href: embeddedItem._links.self.href,
        body: embeddedItem
      });
    }
  }

  return result;

}
