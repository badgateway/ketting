import Resource from './resource';
import { LinkVariables } from './link';

/**
 * Base interface for both FollowOne and FollowAll
 */
abstract class FollowPromise<T> implements PromiseLike<T> {

  protected prefetchEnabled: boolean;
  protected preferTranscludeEnabled: boolean;
  protected useHeadEnabled: boolean;

  constructor() {
    this.prefetchEnabled = false;
    this.preferTranscludeEnabled = false;
    this.useHeadEnabled = false;
  }

  preFetch(): this {
    this.prefetchEnabled = true;
    return this;
  }

  preferTransclude(): this {
    this.preferTranscludeEnabled = true;
    return this;
  }

  /**
   * Use a HTTP HEAD request to fetch the links.
   *
   * This is useful when interacting with servers that embed links in Link
   * Headers.
   */
  useHead(): this {

    this.useHeadEnabled = true;
    return this;

  }

  abstract then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): PromiseLike<TResult1 | TResult2>;
  abstract catch<TResult1 = T, TResult2 = never>(onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): PromiseLike<TResult1 | TResult2>;

}

/**
 * The FollowPromise class is what's being returned from follow() functions.
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
export class FollowPromiseOne<T = any> extends FollowPromise<Resource<T>> {

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
   * This 'catch' function behaves like a Promise catch() function.
   */
  catch<TResult1 = any, TResult2 = never>(onrejected?: ((reason: Error) => TResult2 | PromiseLike<TResult2>) | null | undefined): Promise<TResult1 | TResult2> {

    return this.fetchLinkedResource().then(undefined, onrejected);

  }

  /**
   * Implementation of a Promise.finally function
   */
  finally<TResult1 = any>(onfinally: () => TResult1 | PromiseLike<TResult1>): Promise<TResult1> {

    return this.then(
      () => onfinally(),
      () => onfinally()
    );

  }

  /**
   * Follow another link immediately after following this link.
   *
   * This allows you to follow several hops of links in one go.
   *
   * For example: resource.follow('foo').follow('bar');
   */
  follow<TNested = any>(rel: string, variables?: LinkVariables): FollowPromiseOne<TNested> {

    return new FollowPromiseOne(this.fetchLinkedResource(), rel, variables);

  }

  /**
   * Follows a set of links immediately after following this link.
   *
   * For example: resource.follow('foo').followAll('item');
   */
  followAll<TNested = any>(rel: string): FollowPromiseMany<TNested> {

    return new FollowPromiseMany(this.fetchLinkedResource(), rel);

  }

  /**
   * This function does the actual fetching of the linked
   * resource.
   */
  private async fetchLinkedResource(): Promise<Resource<T>> {

    const resource = await this.resource;

    const headers: { [name: string]: string } = {};
    if (!this.useHeadEnabled && this.preferTranscludeEnabled) {
      headers.Prefer = 'transclude=' + this.rel;
    }

    let state;
    if (this.useHeadEnabled) {
      state = await resource.head({headers});
    } else {
      state = await resource.get({
        headers
      });
    }

    const newResource = state.follow(this.rel, this.variables);

    if (this.prefetchEnabled) {
      newResource.get().catch( err => {
        // eslint-disable-next-line no-console
        console.warn('Error while prefetching linked resource', err);
      });
    }

    return newResource;

  }

}

/**
 */
export class FollowPromiseMany<T = any> extends FollowPromise<Resource<T>[]> {

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
  then<TResult1 = Resource<T>[], TResult2 = never>(
    onfulfilled?: ((value: Resource<T>[]) => TResult1 | PromiseLike<TResult1>) | null | undefined,
    onrejected?: ((reason: Error) => TResult2 | PromiseLike<TResult2>) | null | undefined
  ): Promise<TResult1 | TResult2> {

    return this.fetchLinkedResources().then(onfulfilled, onrejected);

  }

  /**
   * This 'catch' function behaves like a Promise catch() function.
   */
  catch<TResult1 = any, TResult2 = never>(onrejected?: ((reason: Error) => TResult2 | PromiseLike<TResult2>) | null | undefined): Promise<TResult1 | TResult2> {

    return this.fetchLinkedResources().then(undefined, onrejected);

  }

  /**
   * Implementation of a Promise.finally function
   */
  finally<TResult1 = any>(onfinally: () => TResult1 | PromiseLike<TResult1>): Promise<TResult1> {

    return this.then(
      () => onfinally(),
      () => onfinally()
    );

  }

  /**
   * This function does the actual fetching, to obtained the url
   * of the linked resource. It returns the Resource object.
   */
  private async fetchLinkedResources(): Promise<Resource<T>[]> {

    const resource = await this.resource;
    const headers: { [name: string]: string } = {};
    if (!this.useHeadEnabled && this.preferTranscludeEnabled) {
      headers.Prefer = 'transclude=' + this.rel;
    }

    let state;
    if (this.useHeadEnabled) {
      state = await resource.head({headers});
    } else {
      state = await resource.get({
        headers
      });
    }

    const result: Resource<T>[] = state.followAll(this.rel);

    if (this.prefetchEnabled) {
      result.map( resource => {
        resource.get().catch( err => {
          // eslint-disable-next-line no-console
          console.warn('Error while prefetching linked resource', err);
        });
      });
    }

    return result;

  }

}
