import Link from '../link';
// import { resolve } from '../utils/url';
import Representation from './base';

/**
 * A JSON:API link can either be a string, or an object with at least a href
 * property.
 */
type JsonApiLink = string | { href: string };

/**
 * This type represents a valid JSON:API response. We're only interested
 * in the links object at the moment, so everything else is (for now)
 * untyped.
 */
type JsonApiObject = {
  links?: {
    [rel: string]: JsonApiLink | JsonApiLink[]
  },
  [s: string]: any
};

/**
 * This class represents JSON:API responses.
 *
 * The Representor is responsible from extracting any links from the body,
 * so they can be followed.
 */
export default class JsonApi extends Representation {

  body: JsonApiObject;

  constructor(uri: string, contentType: string, body: any) {

    super(uri, contentType, body);

    if (typeof body === 'string') {
      this.body = JSON.parse(body);
    } else {
      this.body = body;
    }

    this.links = parseJsonApiLinks(uri, this.body);

  }

}

/**
 * This function takes a JSON:API object, and extracts the links property.
 */
function parseJsonApiLinks(baseHref: string, body: JsonApiObject): Link[] {

  const result: Link[] = [];

  if (body.links === undefined) {
    return result;
  }

  for (const [rel, linkValue] of Object.entries(body.links)) {

    if (Array.isArray(linkValue)) {
      result.push(...linkValue.map( link => parseJsonApiLink(baseHref, rel, link)));
    } else {
      result.push(parseJsonApiLink(baseHref, rel, linkValue));
    }

  }

  return result;

}

/**
 * This function takes a single link value from a JSON:API link object, and
 * returns a object of type Link
 */
function parseJsonApiLink(baseHref: string, rel: string, link: JsonApiLink): Link {

  return new Link({
    baseHref,
    rel,
    href: typeof link === 'string' ? link : link.href,
  });

}
