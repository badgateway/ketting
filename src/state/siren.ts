import { BaseState } from './base-state';
import { parseLink } from '../http/util';
import { Link, Links } from '../link';
import { resolve } from '../util/uri';
import { ActionInfo } from '../action';
import { Field } from '../field';
import Client from '../client';

/**
 * Represents a resource state in the Siren format
 */
export class SirenState<T, Rels extends string = string> extends BaseState<T, Rels> {

  /**
   * Returns a serialization of the state that can be used in a HTTP
   * response.
   *
   * For example, a JSON object might simply serialize using
   * JSON.serialize().
   */
  serializeBody(): string {

    throw new Error('Reserializing Siren states is not yet supported. Please log an issue in the Ketting project to help figure out how this should be done');

  }

  clone(): SirenState<T, Rels> {

    return new SirenState({
      client: this.client,
      uri: this.uri,
      data: this.data,
      headers: new Headers(this.headers),
      links: new Links(this.uri, this.links),
      actions: this.actionInfo,
    });

  }

}


/**
 * Turns a HTTP response into a SirenState
 */
export const factory = async (client: Client, uri: string, response: Response): Promise<SirenState<any, any>> => {

  const body:SirenEntity<any> = await response.json();

  const links = parseLink(uri, response.headers.get('Link'));
  links.add(...parseSirenLinks(uri, body));

  return new SirenState({
    client,
    uri,
    data: body.properties,
    headers: response.headers,
    links: links,
    embedded: parseSirenEmbedded(client, uri, body, response.headers),
    actions: body.actions ? body.actions.map( action => parseSirenAction(uri, action) ) : [],
  });

};

type SirenProperties = Record<string, any> | undefined;

type SirenEntity<T extends SirenProperties> = {

  class?: string[];

  properties: T;
  entities?: (SirenLink | SirenSubEntity)[];

  links?: SirenLink[];
  actions?: SirenAction[];
  title?: string;

};

type SirenSubEntity = SirenEntity<any> & { rel: string[] };

type SirenLink = {

  class?: string[];
  rel: string[];
  href: string;
  type?: string;
  title?: string;

};

type SirenAction = {
  name: string;
  class?: string[];
  method?: string;
  href: string;
  title?: string;
  type?: string;
  fields?: SirenField[];
};

type SirenField = {
  name: string;
  class?: string[];
  type?: 'hidden' | 'text' | 'search' | 'tel' | 'url' | 'email' | 'password' | 'datetime' | 'date' | 'month' | 'week' | 'time' | 'datetime-local' | 'number' | 'range' | 'color' | 'checkbox' | 'radio' | 'file';
  value?: string;
  title?: string;
};

function parseSirenLinks<Rels extends string>(contextUri: string, body: SirenEntity<any>): Link<Rels>[] {

  const result: Link<Rels>[] = [];

  if (body.links !== undefined) {
    for (const link of body.links) {
      result.push(...parseSirenLink<Rels>(contextUri, link));
    }
  }

  if (body.entities !== undefined) {
    for (const subEntity of body.entities) {
      if ((subEntity as SirenLink).href !== undefined) {
        result.push(...parseSirenLink<Rels>(contextUri, subEntity as SirenLink));
      } else {
        result.push(...parseSirenSubEntityAsLink<Rels>(contextUri, subEntity as SirenSubEntity));
      }
    }
  }

  return result;

}

function parseSirenLink<Rels extends string>(contextUri: string, link: SirenLink): Link<Rels>[] {

  const result: Link<Rels>[] = [];

  const {
    rel: rels,
    ...attributes
  } = link;
  for (const rel of rels) {

    const newLink: Link<Rels> = {
      rel: rel as Rels,
      context: contextUri,
      ...attributes,
    };
    result.push(newLink);

  }

  return result;

}

function parseSirenEmbedded<Rels extends string>(client: Client, contextUri: string, body: SirenEntity<any>, headers: Headers): SirenState<SirenEntity<any>, Rels>[] {

  if (body.entities === undefined) {
    return [];
  }

  const result: SirenState<SirenEntity<any>, Rels>[] = [];

  for (const entity of body.entities) {
    if (isSubEntity(entity)) {
      const subState = parseSirenSubEntityAsEmbedded<Rels>(client, contextUri, entity, headers);
      if (subState !== null) {
        result.push(subState);
      }
    }
  }

  return result;

}

function parseSirenSubEntityAsLink<Rels extends string>(contextUri: string, subEntity: SirenSubEntity): Link<Rels>[] {

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
    const title = subEntity.title;
    const link: Link<Rels> = {
      href: selfHref!,
      rel: rel as Rels,
      context: contextUri,
    };
    if (title) {
      link.title = title;
    }
    return link;
  });

}

function parseSirenSubEntityAsEmbedded<Rels extends string>(client: Client, contextUri: string, subEntity: SirenSubEntity, headers: Headers): SirenState<SirenEntity<any>, Rels> | null {

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

  return new SirenState({
    client,
    uri: subEntityUrl,
    data: subEntity.properties,
    headers,
    links: new Links(selfHref, parseSirenLinks(selfHref, subEntity)),
  });

}

function isSubEntity(input: SirenLink | SirenSubEntity): input is SirenSubEntity {

  return (input as any).href === undefined;

}

function parseSirenAction(uri: string, action: SirenAction): ActionInfo {
  return {
    uri: resolve(uri, action.href),
    name: action.name,
    title: action.title,
    method: action.method || 'GET',
    contentType: action.type || 'application/x-www-form-urlencoded',
    fields: action.fields ? action.fields.map( field => sirenFieldToField(field)) : [],
  };
}

function sirenFieldToField(input: SirenField): Field {

  const result: Field = {
    name: input.name,
    type: input.type || 'text',
    required: false,
    readOnly: false,
  };

  if (input.value) {
    result.value = input.value;
  }
  if (input.title) {
    result.label = input.title;
  }

  return result;
}
