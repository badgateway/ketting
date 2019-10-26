import * as uriTemplate from 'uri-template';
import { resolve } from './utils/url';

type LinkInit = {
  context: string,
  href: string,
  name?: string,
  rel: string,
  templated?: boolean,
  title?: string,
  type?: string,
};

/**
 * The Link object represents a hyperlink.
 */
export class Link {

  /**
   * The base href of the parent document. Used for expanding relative links.
   */
  context: string;

  /**
   * The URI of the link. Might be relative
   */
  href: string;

  /**
   * The name for a link. This might be used to disambiguate the link.
   *
   * If you're looking at this, chances are that you might want 'title'
   * instead.
   */
  name?: string;

  /**
   * The relationship type
   */
  rel: string;

  /**
   * Is it a URI template or not?
   */
  templated: boolean;

  /**
   * A human-readable label for the link.
   */
  title: string | null;

  /**
   * A mimetype
   */
  type: string | null;

  constructor(properties: LinkInit) {

    this.templated = false;
    this.title = null;
    this.type = null;
    for (const key of ['context', 'href', 'name', 'rel', 'templated', 'title', 'type']) {
      if ((<any> properties)[key]) {
        (<any> this)[key] = (<any> properties)[key];
      }
    }

  }


  /**
   * Returns the absolute link url, based on it's base and relative url.
   */
  resolve(): string {

    return resolve(this.context, this.href);

  }

  /**
   * Expands a link template (RFC6570) and resolves the uri
   */
  expand(variables: object): string {

    if (!this.templated) {
      return resolve(this.context, this.href);
    } else {
      const templ = uriTemplate.parse(this.href);
      const expanded = templ.expand(variables);
      return resolve(this.context, expanded);
    }

  }

}

export default Link;

/**
 * A LinkSet is just a map of links, indexes by their rel
 */
export type LinkSet = Map<string, Link[]>;

/**
 * The LinkNotFound error gets thrown whenever something tries to follow a
 * link by its rel, that doesn't exist
 */
export class LinkNotFound extends Error {}
