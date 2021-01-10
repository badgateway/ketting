import { BaseState } from './base-state';
import { HalResource, HalLink, HalFormsProperty } from 'hal-types';
import { parseLink } from '../http/util';
import { Link, Links } from '../link';
import { resolve } from '../util/uri';
import { ActionInfo } from '../action';
import { Field } from '../field';
import { StateFactory } from './interface';
import Client from '../client';

/**
 * Represents a resource state in the HAL format
 */
export class HalState<T = any> extends BaseState<T> {

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

  clone(): HalState<T> {

    return new HalState({
      client: this.client,
      uri: this.uri,
      data: this.data,
      headers: new Headers(this.headers),
      links: new Links(this.links.defaultContext, this.links.getAll()),
      actions: this.actionInfo,
    });

  }

}

/**
 * Turns a HTTP response into a HalState
 */
export const factory:StateFactory = async (client, uri, response): Promise<HalState> => {

  const body = await response.json();
  const links = parseLink(uri, response.headers.get('Link'));

  // The HAL factory is also respondible for plain JSON, which might be an
  // array.
  if (Array.isArray(body)) {
    return new HalState({
      client,
      uri,
      data: body,
      headers: response.headers,
      links,
    });
  }

  links.add(...parseHalLinks(uri, body));

  // Remove _links and _embedded from body
  const {
    _embedded,
    _links,
    _templates,
    ...newBody
  } = body;

  return new HalState({
    client,
    uri: uri,
    data: newBody,
    headers: response.headers,
    links: links,
    embedded: parseHalEmbedded(client, uri, body, response.headers),
    actions: parseHalForms(uri, body),
  });

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
function parseHalEmbedded(client: Client, context: string, body: HalResource, headers: Headers): HalState<any>[] {

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

      result.push(new HalState({
        client,
        uri: resolve(context, embeddedItem._links.self.href),
        data: newBody,
        headers: new Headers({
          'Content-Type': headers.get('Content-Type')!,
        }),
        links: new Links(context, parseHalLinks(context, embeddedItem)),
        // Parsing nested embedded items. Note that we assume that the base url is relative to
        // the outermost parent, not relative to the embedded item. HAL is not clear on this.
        embedded: parseHalEmbedded(client, context, embeddedItem, headers),
      }));
    }
  }

  return result;

}

function parseHalForms(context: string, body: HalResource): ActionInfo[] {

  if (!body._templates) return [];

  return Object.entries(body._templates).map( ([key, hf]) => {
    return {
      uri: resolve(context, hf.target || ''),
      name: key,
      title: hf.title,
      method: hf.method,
      contentType: hf.contentType || 'application/json',
      fields: hf.properties ? hf.properties.map(prop => parseHalField(prop)) : [],
    };
  });

}

function parseHalField(halField: HalFormsProperty): Field {

  const fieldType = halField.type || 'text' as const;

  switch(fieldType) {
    case 'text' :
    case 'hidden' :
    case 'search' :
    case 'tel' :
    case 'url' :
    case 'email' :
      return {
        name: halField.name,
        type: fieldType,
        required: halField.required || false,
        readOnly: halField.readOnly || false,
        value: halField.value,
        pattern: halField.regex ? new RegExp(halField.regex) : undefined,
        label: halField.prompt,
        placeholder: halField.placeHolder,
        minLength: halField.minLength,
        maxLength: halField.maxLength,
      };
    case 'textarea' :
      return {
        name: halField.name,
        type: fieldType,
        required: halField.required || false,
        readOnly: halField.readOnly || false,
        value: halField.value,
        label: halField.prompt,
        placeholder: halField.placeHolder,
        minLength: halField.minLength,
        maxLength: halField.maxLength,
      };
    case 'password' :
      return {
        name: halField.name,
        type: fieldType,
        required: halField.required || false,
        readOnly: halField.readOnly || false,
        label: halField.prompt,
        placeholder: halField.placeHolder,
      };
    case 'date' :
    case 'month' :
    case 'week' :
    case 'time' :
    case 'datetime-local' :
    case 'number' :
    case 'range' :
      return {
        name: halField.name,
        type: fieldType,
        required: halField.required || false,
        readOnly: halField.readOnly || false,
        label: halField.prompt,
        min: halField.min,
        max: halField.max,
        step: halField.step,
      };

    case 'color' :
      return {
        name: halField.name,
        type: fieldType,
        required: halField.required || false,
        readOnly: halField.readOnly || false,
        label: halField.prompt,
      };

  }

}
