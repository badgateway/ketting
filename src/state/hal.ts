import { BaseState, StateFactory } from '../state';
import { HalResource, HalLink } from 'hal-types';
import { parseLink } from '../http/util';
import { Link, Links } from '../link';
import { resolve } from '../util/url';

/**
 * Represents a resource state in the HAL format
 */
export class HalState<T> extends BaseState<T> {

  serializeBody(): string {

    return JSON.stringify(this.body);

  }

}

/**
 * Turns a HTTP response into a HalState
 */
export const factory: StateFactory = async (uri: string, response: Response): Promise<HalState<HalResource>> => {

  const body = await response.json();

  const links = parseLink(uri, response.headers.get('Link'));
  links.add(...parseHalLinks(uri, body));

  // Remove _links and _embedded from body
  const {
    _embedded,
    _links,
    ...newBody
  } = body;

  return new HalState(
    uri,
    newBody,
    response.headers,
    links,
    parseHalEmbedded(uri, body, response.headers),
  );

}

/**
 * Parse the Hal _links object and populate the 'links' property.
 */
function parseHalLinks(context: string, body: HalResource): Link[] {

  if (body._links === undefined) {
    return [];
  }

  const result: Link[] = [];

  /**
   * We're capturing all rel-link pairs so we don't duplicate them if they
   * re-appear in _embedded.
   *
   * Links that are embedded _should_ appear in both lists, but not everyone
   * does this.
   */
  const foundLinks = new Set();

  for (const [relType, links] of Object.entries(body._links)) {

    const linkList = Array.isArray(links) ? links : [links];

    for (const link of linkList) {
      foundLinks.add(relType + ';' + link.href);
    }

    result.push(
      ...parseHalLink(context, relType, linkList)
    );


  }

  if (body._embedded) {
    for (let [rel, innerBodies] of Object.entries(body._embedded)) {

      if (!Array.isArray(innerBodies)) {
        innerBodies = [innerBodies];
      }

      for(const innerBody of innerBodies) {

        const href:string = innerBody?._links?.self?.href;

        if (foundLinks.has(rel + ';' + href)) {
          continue;
        }
        result.push({
          rel: rel,
          href: href,
          context: context,
        });

      }

    }

  }

  return result;

}


/**
 * Parses a single HAL link from a _links object
 */
function parseHalLink(context: string, rel: string, links: HalLink[]): Link[] {

  const result: Link[] = [];

  for (const link of links) {
    result.push({
      rel,
      href: link.href,
      context,
      title: link.title,
      type: link.type,
      templated: link.templated || undefined,
    });
  }

  return result;

}

/**
 * Parse the HAL _embedded object. Right now we're just grabbing the
 * information from _embedded and turn it into links.
 */
function parseHalEmbedded(context: string, body: HalResource, headers: Headers): HalState<any>[] {

  if (body._embedded === undefined) {
    return [];
  }

  const result: HalState<any>[] = [];

  for (const [rel, embedded] of Object.entries(body._embedded)) {

    let embeddedList: HalResource[];

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

      result.push(new HalState(
        resolve(context, embeddedItem._links.self.href),
        embeddedItem,
        new Headers({
          'Content-Type': headers.get('Content-Type')!,
        }),
        new Links(parseHalLinks(context, embeddedItem))
      ));
    }
  }

  return result;

}
