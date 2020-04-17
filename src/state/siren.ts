import { BaseState, StateFactory } from '../state';
import { HalResource, HalLink } from 'hal-types';
import { parseLink } from '../http/util';
import { Link, Links } from '../link';
import { resolve } from '../util/url';

/**
 * Represents a resource state in the Siren format
 */
export class SirenState<T> extends BaseState<T> {

  serializeBody(): string {

    return JSON.stringify(this.body);

  }

}

/**
 * Turns a HTTP response into a HalState
 */
export const factory: StateFactory = async (uri: string, response: Response): Promise<SirenState<SirenEntity>> => {

  const body = await response.json();

  const links = parseLink(uri, response.headers.get('Link'));
  links.add(...parseSirenLinks(uri, body));

  // Remove _links and _embedded from body
  const {
    _embedded,
    _links,
    ...newBody
  } = body;

  return new SirenState(
    uri,
    newBody,
    response.headers,
    links,
    parseSirenEmbedded(uri, body, response.headers),
  );

}


type SirenEntity = {

  class?: string[],

  properties?: {
    [key: string]: any
  },
  entities?: (SirenLink | SirenSubEntity)[],

  links?: SirenLink[],
  actions?: SirenAction[],
  title?: string,

};

type SirenSubEntity = SirenEntity & { rel: string[] };

type SirenLink = {

  class?: string[],
  rel: string[],
  href: string,
  type?: string,
  title?: string,

};

type SirenAction = {
  name: string,
  class?: string[],
  method?: string,
  href: string,
  title?: string,
  type?: string,
  fields?: SirenField[],
};

type SirenField = {
  name: string,
  class?: string[],
  type?: 'hidden' | 'text' | 'search' | 'tel' | 'url' | 'email' | 'password' | 'datetime' | 'date' | 'month' | 'week' | 'time' | 'datetime-local' | 'number' | 'range' | 'color' | 'checkbox' | 'radio' | 'file'
  value?: string,
  title?: string
};

function parseSirenLinks(contextUri: string, body: SirenEntity): Link[] {

  const result: Link[] = [];

  if (body.links !== undefined) {
    for (const link of body.links) {
      result.push(...parseSirenLink(contextUri, link));
    }
  }

  if (body.entities !== undefined) {
    for (const subEntity of body.entities) {
      if ((subEntity as SirenLink).href !== undefined) {
        result.push(...parseSirenLink(contextUri, subEntity as SirenLink));
      } else {
        result.push(...parseSirenSubEntityAsLink(contextUri, subEntity as SirenSubEntity));
      }
    }
  }

  return result;

}

function parseSirenLink(contextUri: string, link: SirenLink): Link[] {

  const result: Link[] = [];

  for (const rel of link.rel) {

    result.push({
      href: link.href,
      rel,
      title: link.title,
      type: link.type,
      context: contextUri,
    });

  }

  return result;

}

function parseSirenEmbedded(contextUri: string, body: SirenEntity, headers: Headers): SirenState<SirenEntity>[] {

  if (body.entities === undefined) {
    return [];
  }

  const result: SirenState<SirenEntity>[] = [];

  for (const entity of body.entities) {
    if ((entity as SirenLink).href === undefined) {
      const subState = parseSirenSubEntityAsEmbedded(contextUri, entity, headers);
      if (subState !== null) {
        result.push(subState);
      }
    }
  }

  return result;

}

function parseSirenSubEntityAsLink(contextUri: string, subEntity: SirenSubEntity): Link[] {

  if (subEntity.links === undefined) {
    // We don't yet support subentities that don't have a URI.
    return [];
  }
  let selfHref: string | null = null;
  for (const link of subEntity.links) {
    if (link.rel.includes('self')) {
      selfHref = link.href;
    }
  }
  if (selfHref === null) {
    // We don't yet support subentities that don't have a URI.
    return [];
  }

  return subEntity.rel.map(rel => {
    return {
      href: selfHref!,
      rel,
      title: subEntity.title,
      context: contextUri,
    };
  });

}

function parseSirenSubEntityAsEmbedded(contextUri: string, subEntity: SirenSubEntity, headers: Headers): SirenState<SirenEntity> | null {

  if (subEntity.links === undefined) {
    // We don't yet support subentities that don't have a URI.
    return null;
  }
  let selfHref = null;
  for (const link of subEntity.links) {
    if (link.rel.includes('self')) {
      selfHref = link.href;
    }
  }
  if (!selfHref) {
    // We don't yet support subentities that don't have a URI.
    return null;
  }

  const subEntityUrl = resolve(contextUri, selfHref);

  return new SirenState(
    subEntityUrl,
    subEntity,
    headers,
    new Links(parseSirenLinks(selfHref, subEntity)),

  );

}
