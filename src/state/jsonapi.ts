import { BaseState } from './base-state';
import { StateFactory } from './interface';
import { HalResource, HalLink } from 'hal-types';
import { parseLink } from '../http/util';
import { Link, Links } from '../link';
import { resolve } from '../util/url';

/**
 * Represents a resource state in the HAL format
 */
export class JsonApiState<T> extends BaseState<T> {

  serializeBody(): string {

    return JSON.stringify(this.body);

  }

}

/**
 * Turns a HTTP response into a JsonApiState
 */
export const factory: StateFactory = async (uri: string, response: Response): Promise<JsonApiState<JsonApiTopLevelObject>> => {

  const body = await response.json();

  const links = parseLink(uri, response.headers.get('Link'));
  links.add(
    ...parseJsonApiLinks(uri, body),
    ...parseJsonApiCollection(uri, body),
  );

  return new JsonApiState(
    uri,
    body,
    response.headers,
    links,
  );

}
/**
 * A JSON:API link can either be a string, or an object with at least a href
 * property.
 */
type JsonApiLink = string | { href: string };

/**
 * This type is a full 'links' object, which might appear on the top level
 * or on resource objects.
 */
type JsonApiLinksObject = {
  self?: JsonApiLink,
  profile?: JsonApiLink,
  [rel: string]: JsonApiLink | JsonApiLink[] | undefined
};

/**
 * This is a single JSON:API resource. Its type contains just the properties
 * we care about.
 */
type JsonApiResource = {
  type: string,
  id: string,
  links?: JsonApiLinksObject,
};


/**
 * This type represents a valid JSON:API response. We're only interested
 * in the links object at the moment, so everything else is (for now)
 * untyped.
 */
type JsonApiTopLevelObject = {
  links?: JsonApiLinksObject,
  data: JsonApiResource | JsonApiResource[] | null,
  [s: string]: any
};

/**
 * This function takes a JSON:API object, and extracts the links property.
 */
function parseJsonApiLinks(contextUri: string, body: JsonApiTopLevelObject): Link[] {

  const result: Link[] = [];

  if (body.links === undefined) {
    return result;
  }

  for (const [rel, linkValue] of Object.entries(body.links)) {

    if (Array.isArray(linkValue)) {
      result.push(...linkValue.map( link => parseJsonApiLink(contextUri, rel, link)));
    } else {
      result.push(parseJsonApiLink(contextUri, rel, linkValue!));
    }

  }

  return result;

}

/**
 * Find collection members in JSON:API objects.
 *
 * A JSON:API top-level object might represent a collection that has 0 or more
 * members.
 *
 * Members of this collection should appear as an 'item' link to the parent.
 */
function parseJsonApiCollection(contextUri: string, body: JsonApiTopLevelObject): Link[] {

  if (!Array.isArray(body.data)) {
    // Not a collection
    return [];
  }

  const result: Link[] = [];
  for (const member of body.data) {

    if ('links' in member && 'self' in member.links!) {

      const selfLink = parseJsonApiLink(contextUri, 'self', member.links!.self!);
      result.push({
        context: contextUri,
        href: selfLink.href,
        rel: 'item'
      });

    }
  }

  return result;

}

/**
 * This function takes a single link value from a JSON:API link object, and
 * returns a object of type Link
 */
function parseJsonApiLink(contextUri: string, rel: string, link: JsonApiLink): Link {

  return ({
    context: contextUri,
    rel,
    href: typeof link === 'string' ? link : link.href,
  });

}
