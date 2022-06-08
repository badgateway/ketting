import { LinkHints } from 'hal-types';
import { resolve } from './util/uri';

export type Link = {
  /**
   * Target URI
   */
  href: string;

  /**
   * Context URI.
   *
   * Used to resolve relative URIs
   */
  context: string;

  /**
   * Relation type
   */
  rel: string;

  /**
   * Link title
   */
  title?: string;

  /**
   * Content type hint of the target resource
   */
  type?: string;

  /**
   * Anchor.
   *
   * This describes where the link is linked from, from for example
   * a fragment in the current document
   */
  anchor?: string;

  /**
   * Language of the target resource
   */
  hreflang?: string;

  /**
   * HTML5 media attribute
   */
  media?: string;

  /**
   * If templated is set to true, the href is a templated URI.
   */
  templated?: boolean;

  /**
   * Link hints, as defined in draft-nottingham-link-hint
   */
  hints?: LinkHints;

}

type NewLink = Omit<Link, 'context'>;


/**
 * Links container, providing an easy way to manage a set of links.
 */
export class Links {

  private store: Map<string, Link[]>;

  constructor(public defaultContext: string, links?: Link[] | Links) {

    this.store = new Map();

    if (links) {
      if (links instanceof Links) {
        this.add(...links.getAll());
      } else {
        for (const link of links) {
          this.add(link);
        }
      }
    }

  }

  /**
   * Adds a link to the list
   */
  add(...links: (Link | NewLink)[]): void
  add(rel: string, href: string): void
  add(...args: any[]): void {

    let links: Link[];

    if (typeof args[0] === 'string') {
      links = [{
        rel: args[0],
        href: args[1],
        context: this.defaultContext,
      }];
    } else {
      links = args.map( link => { return { context: this.defaultContext, ...link };} );
    }

    for(const link of links) {
      if (this.store.has(link.rel)) {
        this.store.get(link.rel)!.push(link);
      } else {
        this.store.set(link.rel, [link]);
      }
    }

  }

  /**
   * Set a link
   *
   * If a link with the provided 'rel' already existed, it will be overwritten.
   */
  set(link: Link | NewLink): void
  set(rel: string, href: string): void
  set(arg1: any, arg2?: any): void {

    let link: Link;
    if (typeof arg1 === 'string') {
      link = {
        rel: arg1,
        href: arg2,
        context: this.defaultContext,
      };
    } else {
      link = {
        context: this.defaultContext,
        ...arg1,
      };
    }
    this.store.set(link.rel, [link]);

  }

  /**
   * Return a single link by its 'rel'.
   *
   * If the link does not exist, undefined is returned.
   */
  get(rel: string): Link|undefined {

    const links = this.store.get(rel);
    if (!links || links.length < 0) {
      return undefined;
    }
    return links[0];

  }

  /**
    * Delete all links with the given 'rel'.
   *
   * If the second argument is provided, only links that match the href will
   * be removed.
   */
  delete(rel: string, href?: string): void {

    if (href===undefined) {
      this.store.delete(rel);
      return;
    }

    const uris = this.store.get(rel);
    if (!uris) return;

    this.store.delete(rel);
    const absHref = resolve(this.defaultContext, href);
    this.store.set(rel,
      uris.filter(uri => resolve(uri) !== absHref)
    );
  }

  /**
   * Return all links that have a given rel.
   *
   * If no links with the rel were found, an empty array is returned.
   */
  getMany(rel: string): Link[] {

    return this.store.get(rel) || [];

  }

  /**
   * Return all links.
   */
  getAll(): Link[] {
    const result = [];
    for(const links of this.store.values()) {
      result.push(...links);
    }
    return result;
  }

  /**
   * Returns true if at least 1 link with the given rel exists.
   */
  has(rel: string): boolean {

    return this.store.has(rel);

  }

}

/**
 * The LinkNotFound error gets thrown whenever something tries to follow a
 * link by its rel, that doesn't exist
 */
export class LinkNotFound extends Error {}

/**
 * A key->value map of variables to place in a templated link
 */
export type LinkVariables = {
  [key: string]: string | number | string[] | number[];
};
