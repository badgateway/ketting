export type Link = {
  /**
   * Target URI
   */
  href: string,

  /**
   * Context URI.
   *
   * Used to resolve relative URIs
   */
  context: string;

  /**
   * Relation type
   */
  rel: string,

  /**
   * Link title
   */
  title?: string,

  /**
   * Content type hint of the target resource
   */
  type?: string,

  /**
   * Anchor.
   *
   * This describes where the link is linked from, from for example
   * a fragment in the current document
   */
  anchor?: string,

  /**
   * Language of the target resource
   */
  hreflang?: string,

  /**
   * HTML5 media attribute
   */
  media?: string,

  /**
   * If templated is set to true, the href is a templated URI.
   */
  templated?: boolean,

}

type NewLink = Omit<Link, 'context'>;


/**
 * Links container, providing an easy way to manage a set of links.
 */
export class Links {

  store: Map<string, Link[]>

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
      links = args.map( link => { return { context: this.defaultContext, ...link }} );
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
      }
    }
    this.store.set(link.rel, [link]);

  }

  get(rel: string): Link|undefined {

    const links = this.store.get(rel);
    if (!links || links.length < 0) {
      return undefined;
    }
    return links[0];

  }

  getMany(rel: string): Link[] {

    return this.store.get(rel) || [];

  }

  getAll(): Link[] {
    const result = [];
    for(const links of this.store.values()) {
      result.push(...links);
    }
    return result;
  }

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
  [key: string]: string | number
};
