import Link from '../link';
import { resolve } from '../utils/url';
import Representation from './base';

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

/**
 * The Representation class is basically a 'body' of a request
 * or response.
 *
 * This class is for Siren responses.
 *
 * https://github.com/kevinswiber/siren
 */
export default class Siren extends Representation<SirenEntity> {

  parse(body: string): SirenEntity {

    return JSON.parse(body);

  }

  parseLinks(body: SirenEntity): Link[] {

    const result: Link[] = [];

    if (body.links !== undefined) {
      for (const link of body.links) {
        result.push(...parseSirenLink(this.uri, link));
      }
    }

    if (body.entities !== undefined) {
      for (const subEntity of body.entities) {
        if ((subEntity as SirenLink).href !== undefined) {
          result.push(...parseSirenLink(this.uri, subEntity as SirenLink));
        } else {
          result.push(...parseSirenSubEntityAsLink(this.uri, subEntity as SirenSubEntity));
        }
      }
    }

    return result;

  }

  getEmbedded(): { [uri: string]: SirenEntity } {

    if (this.body.entities === undefined) {
      return {};
    }

    const result: { [uri: string]: SirenEntity} = {};

    for (const entity of this.body.entities) {
      if ((entity as SirenLink).href === undefined) {
        const embedded = parseSirenSubEntityAsEmbedded(this.uri, entity);
        if (embedded !== null) {
          result[embedded[0]] = embedded[1];
        }
      }
    }

    return result;

  }


}

function parseSirenLink(contextUri: string, link: SirenLink): Link[] {

  const result: Link[] = [];

  for (const rel of link.rel) {

    result.push(
      new Link({
        href: link.href,
        rel,
        title: link.title,
        type: link.type,
        context: contextUri,
      })
    );

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
    return new Link({
      href: selfHref!,
      rel,
      title: subEntity.title,
      context: contextUri,
    });
  });

}

function parseSirenSubEntityAsEmbedded(contextUri: string, subEntity: SirenSubEntity): [string, SirenSubEntity] | null {

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

  return [resolve(contextUri, selfHref), subEntity];

}
