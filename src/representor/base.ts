import { Link, LinkNotFound, LinkSet } from '../link';


/**
 * The Representation class is basically a 'body' of a request
 * or response.
 *
 * This is base class for a representation.
 */
export default abstract class Representation<T = string> {

  contentType: string;
  uri: string;

  protected body: T;
  protected links: LinkSet;

  constructor(uri: string, contentType: string, body: string | null, headerLinks: LinkSet) {

    this.uri = uri;
    this.contentType = contentType;
    this.links = headerLinks;
    if (body !== null) {
      this.setBody(this.parse(body));
    }

  }

  getLink(rel: string): Link {

    const links = this.links.get(rel);

    if (!links || links.length === 0) {
      throw new LinkNotFound('Link with rel: ' + rel + ' not found on resource: ' + this.uri);
    }

    return links[0];

  }

  getLinks(rel?: string): Link[] {

    if (!rel) {
      return ([] as Link[]).concat(...this.links.values());
    }

    const links = this.links.get(rel);
    return links || [];

  }

  getEmbedded(): { [uri: string]: T } {

    return {};

  }

  /**
   * Returns the parsed body for this representation.
   *
   * Specific implementations of this class might alter the response before
   * returning, for example to remove meta-information that's not relevant
   * the user of this object.
   */
  getBody(): T {

    return this.body;

  }

  setBody(body: T) {
    for (const link of this.parseLinks(body)) {
      if (this.links.has(link.rel)) {
        this.links.get(link.rel)!.push(link);
      } else {
        this.links.set(link.rel, [link]);
      }
    }
    this.body = body;
  }

  /**
   * parse is called to convert a HTTP response body string into the most
   * suitable internal body type.
   *
   * For JSON responses, usually this means calling JSON.parse() and returning
   * the result.
   */
  protected abstract parse(body: string): T;

  /**
   * Parse links.
   *
   * This function gets called once by this object to parse any in-document
   * links.
   */
  protected parseLinks(body: T): Link[] {

    return [];

  }

}
