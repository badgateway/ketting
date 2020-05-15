import { BaseState } from './base-state';
import { parseLink } from '../http/util';
import { Link, Links } from '../link';
import { resolve } from '../util/uri';
import { Action, ActionNotFound } from '../action';
import * as qs from 'querystring';
import { State } from './interface';

/**
 * Represents a resource state in the Siren format
 */
export class SirenState<T> extends BaseState<T> {

  private actions: SirenAction[];

  constructor(uri: string, data: SirenEntity<T>, headers: Headers, links: Links, embedded?: SirenState<any>[]) {

    const properties = data.properties;
    const actions = data.actions;

    super(uri, properties, headers, links, embedded);
    this.actions = actions || [];

  }

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

  /**
   * Return an action by name.
   *
   * If the format provides a default action, the name may be omitted.
   */
  action<TFormData = any>(name?: string): Action<TFormData> {

    if (name === undefined) {
      throw new ActionNotFound('Siren doesn\'t define default actions');
    }

    for(const action of this.actions) {
      if (action.name === name) {
        return {
          submit: async(formData: TFormData): Promise<State<any>> => {

            const method = action.method || 'GET';
            const type = action.type || 'application/x-www-form-urlencoded';

            const uri = new URL(action.href);

            if (method === 'GET') {
              uri.search = qs.stringify(formData);
              const resource = this.client.go(uri.toString());
              return resource.get();
            }
            let body;
            switch (type) {
              case 'application/x-www-form-urlencoded' :
                body = qs.stringify(formData);
                break;
              case 'application/json':
                body = JSON.stringify(formData);
                break;
              default :
                throw new Error(`Serializing mimetype ${type} is not yet supported in actions`);
            }
            const response = await this.client.fetcher.fetchOrThrow(uri.toString(), {
              method,
              body,
              headers: {
                'Content-Type': type
              }
            });
            const state = this.client.getStateForResponse(uri.toString(), response);
            return state;

          }
        };
      }
    }
    throw new ActionNotFound(`Action with name "${name}" not found.`);

  }

  clone(): SirenState<T> {

    return new SirenState(
      this.uri,
      {
        properties: this.data
      },
      new Headers(this.headers),
      new Links(this.links),
    );

  }

}

/**
 * Turns a HTTP response into a SirenState
 */
export const factory = async (uri: string, response: Response): Promise<SirenState<any>> => {

  const body = await response.json();

  const links = parseLink(uri, response.headers.get('Link'));
  links.add(...parseSirenLinks(uri, body));

  return new SirenState(
    uri,
    body,
    response.headers,
    links,
    parseSirenEmbedded(uri, body, response.headers),
  );

}

type SirenProperties = Record<string, any> | undefined;

type SirenEntity<T extends SirenProperties> = {

  class?: string[],

  properties: T
  entities?: (SirenLink | SirenSubEntity)[],

  links?: SirenLink[],
  actions?: SirenAction[],
  title?: string,

};

type SirenSubEntity = SirenEntity<any> & { rel: string[] };

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

function parseSirenLinks(contextUri: string, body: SirenEntity<any>): Link[] {

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

  const {
    rel: rels,
    ...attributes
  } = link;
  for (const rel of rels) {

    const newLink: Link = {
      rel,
      context: contextUri,
      ...attributes,
    };
    result.push(newLink);

  }

  return result;

}

function parseSirenEmbedded(contextUri: string, body: SirenEntity<any>, headers: Headers): SirenState<SirenEntity<any>>[] {

  if (body.entities === undefined) {
    return [];
  }

  const result: SirenState<SirenEntity<any>>[] = [];

  for (const entity of body.entities) {
    if (isSubEntity(entity)) {
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
    const title = subEntity.title;
    const link: Link = {
      href: selfHref!,
      rel,
      context: contextUri,
    };
    if (title) {
      link.title = title;
    }
    return link;
  });

}

function parseSirenSubEntityAsEmbedded(contextUri: string, subEntity: SirenSubEntity, headers: Headers): SirenState<SirenEntity<any>> | null {

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

function isSubEntity(input: SirenLink | SirenSubEntity): input is SirenSubEntity {

  return (input as any).href === undefined;

}
