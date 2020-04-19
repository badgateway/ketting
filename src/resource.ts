import Client from './client';
import { State } from './state';
import { resolve } from './util/url';
import { FollowPromiseOne, FollowPromiseMany } from './follow-promise';
import { Link, LinkNotFound, LinkVariables } from './link';

/**
 * A 'resource' represents an endpoint on the server.
 *
 * The endpoint has a uri, you might for example be able to GET its
 * presentation.
 *
 * A resource may also have a list of links on them, pointing to other
 * resources.
 */
export default class Resource<T = any> {

  uri: string;
  client: Client;

  activeRefresh: Promise<State<T>> | null;

  /**
   * uri must be absolute
   */
  constructor(client: Client, uri: string) {
    this.client = client;
    this.uri = uri;
    this.activeRefresh = null;

  }

  /**
   * Gets the current state of the resource.
   *
   * This function will return a State object.
   */
  get(getOptions?: GetOptions): Promise<State<T>> {

    return this.refresh(getOptions);

  }

  /**
   * Gets the current state of the resource, skipping
   * the cache.
   *
   * This function will return a State object.
   */
  refresh(getOptions?: GetOptions): Promise<State<T>> {

    if (!this.activeRefresh) {
      this.activeRefresh = (async() : Promise<State<T>> => {
        const response = await this.fetchOrThrow();
        return this.client.getStateForResponse(this.uri, response);
      })();
    }

    return this.activeRefresh;

  }

  /**
   * Updates the server state with a PUT request
   */
  async put(state: State<T>): Promise<void> {

    const params = {
      method: 'PUT',
      body: state.serializeBody(),
      headers: state.contentHeaders(),
    };
    await this.fetchOrThrow(params);

  }

  /**
   * Deletes the resource
   */
  async delete(): Promise<void> {

    await this.fetchOrThrow(
      { method: 'DELETE' }
    );

  }

  /**
   * Follows a relationship, based on its reltype. For example, this might be
   * 'alternate', 'item', 'edit' or a custom url-based one.
   *
   * This function can also follow templated uris. You can specify uri
   * variables in the optional variables argument.
   */
  follow<TFollowedResource = any>(rel: string, variables?: LinkVariables): FollowPromiseOne<TFollowedResource> {

    return new FollowPromiseOne(this, rel, variables);

  }

  /**
   * Follows a relationship based on its reltype. This function returns a
   * Promise that resolves to an array of Resource objects.
   *
   * If no resources were found, the array will be empty.
   */
  followAll<TFollowedResource = any>(rel: string): FollowPromiseMany<TFollowedResource> {

    return new FollowPromiseMany(this, rel);

  }

  /**
   * Resolves a new resource based on a relative uri.
   *
   * Use this function to manually get a Resource object via a uri. The uri
   * will be resolved based on the uri of the current resource.
   *
   * This function doesn't do any HTTP requests.
   */
  go<TGoResource = any>(uri: string): Resource<TGoResource> {

    uri = resolve(this.uri, uri);
    return this.client.go(uri);

  }

  /**
   * Does a HTTP request on the current resource URI
   */
  fetch(init?: RequestInit): Promise<Response> {

    return this.client.fetcher.fetch(this.uri, init);

  }

  /**
   * Does a HTTP request on the current resource URI.
   *
   * If the response was a 4XX or 5XX, this function will throw
   * an exception.
   */
  fetchOrThrow(init?: RequestInit): Promise<Response> {

    return this.client.fetcher.fetchOrThrow(this.uri, init);

  }

  /**
   * Returns a Link object, by its REL.
   *
   * If the link does not exist, a LinkNotFound error will be thrown.
   *
   * @deprecated
   */
  async link(rel: string): Promise<Link> {

    const state = await this.get();
    const link = state.links.get(rel);

    if (!link) {
      throw new LinkNotFound(`Link with rel: ${rel} not found on ${this.uri}`);
    }
    return link;

  }

  /**
   * Returns all links defined on this object.
   *
   * @deprecated
   */
  async links(): Promise<Link[]> {

    const state = await this.get();
    const links = state.links.getAll();

    return links;

  }

}

type GetOptions = {
  headers: Headers | {
    [name: string]: string,
  }
}
