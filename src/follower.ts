import Resource from './resource';
import { LinkVariables } from './types';

/**
 * The Follower class is what's being returned from follow() functions.
 *
 * It's 'PromiseLike', which means you can treat it like a Promise, and it
 * can be awaited. When used as a Promise, it resolves to the Resource object
 * that was followed.
 *
 * In addition to being a Promise<Resource> stand-in, it also exposes other
 * functions, namely:
 *
 * * `follow()` to allow a user to chain several follow() functions to do
 *   several 'hops' all at once.
 * * `followAll()`, allowing a user to call `followAll()` at the end of a
 *   chain.
 */
export default class Follower implements PromiseLike<Resource> {

  private resource: Resource | Promise<Resource>;
  private rel: string;
  private variables?: LinkVariables;

  constructor(resource: Resource | Promise<Resource>, rel: string, variables?: LinkVariables) {

    this.resource = resource;
    this.rel = rel;
    this.variables = variables;

  }

  /**
   * This 'then' function behaves like a Promise then() function.
   */
  then<TResult1 = Resource<any>, TResult2 = never>(onfulfilled?: ((value: Resource<any>) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined): Promise<TResult1 | TResult2> {

    return this.fetchLinkedResource().then(onfulfilled, onrejected);

  }

  /**
   * Follow another link immediately after following this link.
   *
   * This allows you to follow several hops of links in one go.
   *
   * For example: resource.follow('foo').follow('bar');
   */
  follow(rel: string, variables?: LinkVariables): Follower {

    return new Follower(this.fetchLinkedResource(), rel, variables);

  }

  /**
   * Follows a set of links immediately after following this link.
   *
   * For example: resource.follow('foo').followAll('item');
   */
  async followAll(rel: string): Promise<Resource[]> {

    return (await this.fetchLinkedResource()).followAll(rel);

  }

  /**
   * This function does the actual fetching of the linked resource.
   */
  private async fetchLinkedResource(): Promise<Resource> {

    const resource = await this.resource;
    const link = await resource.link(this.rel);
    let href;

    if (link.templated && this.variables) {
      href = link.expand(this.variables);
    } else {
      href = link.resolve();
    }

    const newResource = resource.go(href);
    if (link.type) {
      newResource.contentType = link.type;
    }

    return newResource;

  }

}
