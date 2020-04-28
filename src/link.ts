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

export class Links {

  store: Map<string, Link[]>

  constructor(links?: Link[]) {

    this.store = new Map();
    if (links) {
      for (const link of links) {
        this.add(link);
      }
    }

  }

  add(...links: Link[]): void {

    for(const link of links) {
      if (this.store.has(link.rel)) {
        this.store.get(link.rel)!.push(link);
      } else {
        this.store.set(link.rel, [link]);
      }
    }

  }

  set(link: Link): void {

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

  get size(): number {
    return this.store.size;
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
