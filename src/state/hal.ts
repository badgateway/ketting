import { BaseState } from './base-state';
import { HalResource, HalLink, HalFormsTemplate, HalFormsProperty } from 'hal-types';
import { parseLink } from '../http/util';
import { Link, Links } from '../link';
import { resolve } from '../util/uri';
import { Action, ActionNotFound, SimpleAction } from '../action';
import Client from '../client';
import { Field } from '../field';

/**
 * Represents a resource state in the HAL format
 */
export class HalState<T = any> extends BaseState<T> {

  private halForm?: (client: Client) => Action<any>;

  constructor(uri: string, body: T, headers: Headers, links: Links, embedded?: HalState[], halForm?: (client: Client) => Action<any>) {
    super(uri, body, headers, links, embedded);

    this.halForm = halForm;
  }

  serializeBody(): string {

    return JSON.stringify({
      _links: this.serializeLinks(),
      ...this.data
    });

  }

  private serializeLinks(): HalResource['_links'] {

    const links: HalResource['_links'] = {
      self: { href: this.uri },
    };
    for(const link of this.links.getAll()) {

      const { rel, context, ...attributes } = link;

      if (rel === 'self') {
        // skip
        continue;
      }

      if (links[rel] === undefined) {
        // First link of its kind
        links[rel] =  attributes;
      } else if (Array.isArray(links[rel])) {
        // Add link to link array.
        (links[rel] as HalLink[]).push(attributes);
      } else {
        // 1 link with this rel existed, so we will transform it to an array.
        links[rel] = [links[rel] as HalLink, attributes];
      }

    }

    return links;

  }

  clone(): HalState {

    return new HalState(
      this.uri,
      this.data,
      new Headers(this.headers),
      new Links(this.uri, this.links)
    );

  }

  /**
   * Return an action by name.
   *
   * If the format provides a default action, the name may be omitted.
   */
  action<TFormData = any>(name?: string): Action<TFormData> {

    if (!this.halForm || name !== undefined) {
      throw new ActionNotFound('This State defines no action');
    }
    return this.halForm(this.client);

  }

}

/**
 * Turns a HTTP response into a HalState
 */
export const factory = async (uri: string, response: Response): Promise<HalState> => {

  const body = await response.json();
  const links = parseLink(uri, response.headers.get('Link'));

  // The HAL factory is also respondible for plain JSON, which might be an
  // array.
  if (Array.isArray(body)) {
    return new HalState(
      uri,
      body,
      response.headers,
      links,
      [],
    );
  }

  links.add(...parseHalLinks(uri, body));

  // Remove _links and _embedded from body
  const {
    _embedded,
    _links,
    _templates,
    ...newBody
  } = body;

  const halForm: HalFormsTemplate|undefined = body._templates?.default;

  return new HalState(
    uri,
    newBody,
    response.headers,
    links,
    parseHalEmbedded(uri, body, response.headers),
    halForm ? parseHalForm(uri, halForm) : undefined
  );

};

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
    // eslint-disable-next-line prefer-const
    for (let [rel, innerBodies] of Object.entries(body._embedded)) {

      if (!Array.isArray(innerBodies)) {
        innerBodies = [innerBodies];
      }

      for(const innerBody of innerBodies) {

        const href:string = innerBody?._links?.self?.href;
        if (!href) {
          continue;
        }

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
      context,
      ...link,
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

  for (const embedded of Object.values(body._embedded)) {

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
      // Remove _links and _embedded from body
      const {
        _embedded,
        _links,
        ...newBody
      } = embeddedItem;

      result.push(new HalState(
        resolve(context, embeddedItem._links.self.href),
        newBody,
        new Headers({
          'Content-Type': headers.get('Content-Type')!,
        }),
        new Links(context, parseHalLinks(context, embeddedItem)),
        // Parsing nested embedded items. Note that we assume that the base url is relative to
        // the outermost parent, not relative to the embedded item. HAL is not clear on this.
        parseHalEmbedded(context, embeddedItem, headers),
      ));
    }
  }

  return result;

}

function parseHalForm(context: string, templ: HalFormsTemplate): (client: Client) => Action<any> {

  return (client: Client) => {

    return new SimpleAction(
      client,
      templ.method,
      context,
      templ.contentType || 'application/json',
      templ.properties ? templ.properties.map( prop => parseHalField(prop)) : [],
    );

  };

}

function parseHalField(halField: HalFormsProperty): Field {

  return {
    name: halField.name,
    type: 'text',
    required: halField.required || false,
    readOnly: halField.readOnly || false,
    value: halField.value,
    pattern: halField.regex ? new RegExp(halField.regex) : undefined,
    label: halField.prompt,
  };

}
