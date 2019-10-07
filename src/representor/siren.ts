import Link from '../link';
import { resolve } from '../utils/url';
import Representation from './base';

type SirenEntity = {

  class?: string[],

  properties?: {
    [key: string]: any
  },
  entities?: Array<SirenLink | SirenSubEntity>,

  links?: SirenLink[],
  actions?: SirenAction[],
  title?: string,

};

type SirenSubEntity = SirenEntity & { rel: string };

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
export default class Siren extends Representation {

  body: SirenEntity;

  constructor(uri: string, contentType: string, body: string | SirenEntity) {

    super(uri, contentType, body);

    if (typeof body === 'string') {
      this.body = JSON.parse(body);
    } else {
      this.body = body;
    }

    parseSirenLinks(this);

    if (this.body.entities !== undefined) {
      parseSirenSubentitites(this);
    }

  }

}

function parseSirenLinks(representation: Siren): void {

  if (representation.body.links === undefined) {
    return;
  }
  for (const link of representation.body.links) {
    parseSirenLink(representation, link);
  }

}

function parseSirenLink(representation: Siren, link: SirenLink): void {

  for (const rel of link.rel) {

    representation.links.push(
      new Link({
        href: link.href,
        rel,
        title: link.title,
        type: link.type,
        context: representation.uri,
      })
    );

  }

}

function parseSirenSubentitites(representation: Siren) {

  if (representation.body.entities === undefined) {
    return;
  }

  for (const embeddedItem of representation.body.entities) {

    if ((embeddedItem as SirenLink).href !== undefined) {
      parseSirenLink(representation, embeddedItem as SirenLink);
    } else {
      parseSirenSubEntity(representation, embeddedItem as SirenSubEntity);
    }
  }

}

function parseSirenSubEntity(representation: Siren, subEntity: SirenSubEntity) {

  if (subEntity.links === undefined) {
    // We don't yet support subentities that don't have a URI.
    return;
  }
  let selfHref = null;
  for (const link of subEntity.links) {
    if (link.rel.includes('self')) {
      selfHref = link.href;
    }
  }
  if (!selfHref) {
    // We don't yet support subentities that don't have a URI.
    return;
  }

  for (const rel of subEntity.rel) {
    representation.links.push(new Link({
      href: selfHref,
      rel,
      title: subEntity.title,
      context: representation.uri,
    }));

  }

  representation.embedded[resolve(representation.uri, selfHref)] = subEntity;

}
