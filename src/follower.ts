import Resource from './resource';
import { LinkVariables } from './types';

/**
 * Base interface for both FollowOne and FollowAll
 */
abstract class Follower<T> implements PromiseLike<T> {

  protected prefetchEnabled: boolean;
  protected preferPushEnabled: boolean;
  protected preferTranscludeEnabled: boolean;

  preFetch(): this {
    this.prefetchEnabled = true;
    return this;
  }

  preferPush(): this {
    this.preferPushEnabled = true;
    return this;
  }

  preferTransclude(): this {
    this.preferTranscludeEnabled = true;
    return this;
  }

  abstract then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): PromiseLike<TResult1 | TResult2>;
  abstract catch<TResult1 = T, TResult2 = never>(onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): PromiseLike<TResult1 | TResult2>;

}

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
export class FollowerOne<T = any> extends Follower<Resource<T>> {

  private resource: Resource | Promise<Resource>;
  private rel: string;
  private variables?: LinkVariables;

  constructor(resource: Resource | Promise<Resource>, rel: string, variables?: LinkVariables) {

    super();
    this.resource = resource;
    this.rel = rel;
    this.variables = variables;

  }

  /**
   * This 'then' function behaves like a Promise then() function.
   *
   * This method signature is pretty crazy, but trust that it's pretty much
   * like any then() method on a promise.
   */
  then<TResult1 = Resource<T>, TResult2 = never>(
    onfulfilled?: ((value: Resource<T>) => TResult1 | PromiseLike<TResult1>) | null | undefined,
    onrejected?: ((reason: Error) => TResult2 | PromiseLike<TResult2>) | null | undefined
  ): Promise<TResult1 | TResult2> {

    return this.fetchLinkedResource().then(onfulfilled, onrejected);

  }

  /**
   * This 'then' function behaves like a Promise then() function.
   */
  catch<TResult1 = any, TResult2 = never>(onrejected?: ((reason: Error) => TResult2 | PromiseLike<TResult2>) | null | undefined): Promise<TResult1 | TResult2> {

    return this.fetchLinkedResource().then(undefined, onrejected);

  }

  /**
   * Follow another link immediately after following this link.
   *
   * This allows you to follow several hops of links in one go.
   *
   * For example: resource.follow('foo').follow('bar');
   */
  follow<TNested = any>(rel: string, variables?: LinkVariables): FollowerOne<TNested> {

    return new FollowerOne(this.fetchLinkedResource(), rel, variables);

  }

  /**
   * Follows a set of links immediately after following this link.
   *
   * For example: resource.follow('foo').followAll('item');
   */
  async followAll<TNested = any>(rel: string): Promise<Array<Resource<TNested>>> {

    return new FollowerMany(this.fetchLinkedResource(), rel);

  }

  /**
   * This function does the actual fetching, to obtained the url
   * of the linked resource. It returns the Resource object.
   */
  private async fetchLinkedResource(): Promise<Resource<T>> {

    const resource = await this.resource;
    if (this.preferPushEnabled) {
      resource.addNextRefreshHeader('Prefer-Push', this.rel);
    }
    if (this.preferTranscludeEnabled) {
      resource.addNextRefreshHeader('Prefer', 'transclude=' + this.rel);
    }
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
    } else {
      newResource.contentType = resource.contentType;
    }

    if (this.prefetchEnabled) {
      newResource.get().catch( err => {
        // tslint:disable-next-line no-console
        console.warn('Error while prefetching linked resource', err);
      });
    }

    return newResource;
  }

}

/**
 */
export class FollowerMany<T = any> extends Follower<Array<Resource<T>>> {

  private resource: Resource | Promise<Resource>;
  private rel: string;

  constructor(resource: Resource | Promise<Resource>, rel: string) {

    super();
    this.resource = resource;
    this.rel = rel;

  }

  /**
   * This 'then' function behaves like a Promise then() function.
   */
  then<TResult1 = Array<Resource<T>>, TResult2 = never>(
    onfulfilled?: ((value: Array<Resource<T>>) => TResult1 | PromiseLike<TResult1>) | null | undefined,
    onrejected?: ((reason: Error) => TResult2 | PromiseLike<TResult2>) | null | undefined
  ): Promise<TResult1 | TResult2> {

    return this.fetchLinkedResources().then(onfulfilled, onrejected);

  }

  /**
   * This 'then' function behaves like a Promise then() function.
   */
  catch<TResult1 = any, TResult2 = never>(onrejected?: ((reason: Error) => TResult2 | PromiseLike<TResult2>) | null | undefined): Promise<TResult1 | TResult2> {

    return this.fetchLinkedResources().then(undefined, onrejected);

  }

  /**
   * This function does the actual fetching, to obtained the url
   * of the linked resource. It returns the Resource object.
   */
  private async fetchLinkedResources(): Promise<Array<Resource<T>>> {

    const resource = await this.resource;
    if (this.preferPushEnabled) {
      resource.addNextRefreshHeader('Prefer-Push', this.rel);
    }
    if (this.preferTranscludeEnabled) {
      resource.addNextRefreshHeader('Prefer', 'transclude=' + this.rel);
    }

    const links = await resource.links(this.rel);
    let href;

    const result: Array<Resource<T>> = [];

    for (const link of links) {
      href = link.resolve();

      const newResource = resource.go(href);
      if (link.type) {
        newResource.contentType = link.type;
      }
      result.push(newResource);
      if (this.prefetchEnabled) {
        newResource.get().catch( err => {
          // tslint:disable-next-line no-console
          console.warn('Error while prefetching linked resource', err);
        });
      }
    }

    return result;

  }

}
