export type Link = {
  href: string,
  rel: string,
  title?: string,
  anchor?: string,
  hreflang?: string,
  media?: string,
  type?: string,
  templated?: true,
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

  add(link: Link): void {

    if (this.store.has(link.rel)) {
      this.store.get(link.rel)!.push(link);
    } else {
      this.store.set(link.rel, [link]);
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
