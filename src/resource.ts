import client from './client';
import { State } from './state';
import { resolve } from './util/url';
import { FollowPromiseOne, FollowPromiseMany } from './follow-promise';
import { LinkVariables } from './link';

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

  /**
   * uri must be absolute
   */
  constructor(uri: string) {
    this.uri = uri;
  }

  /**
   * Gets the current state of the resource.
   *
   * This function will return a State object.
   */
  async get(getOptions?: GetOptions): Promise<State<T>> {

    const response = await client.fetcher.fetch(this.uri);
    return client.getStateForResponse(this.uri, response);

  }

  async put(state: State<T>): Promise<void> {

    const params = {
      method: 'PUT',
      body: state.serializeBody(),
      headers: state.contentHeaders(),
    };
    await client.fetcher.fetchAndThrow(this.uri, params);

  }

  /**
   * Deletes the resource
   */
  async delete(): Promise<void> {

    await client.fetcher.fetchAndThrow(
      this.uri,
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
    return client.go(uri);

  }

}

type GetOptions = {
  headers: Headers | {
    [name: string]: string,
  }
}
