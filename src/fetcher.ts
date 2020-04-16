import problemFactory from './http/error';

/**
 * The fetcher object is responsible for calling fetch()
 */
export default class Fetcher {

  fetch(resource: string|Request, init?: RequestInit): Promise<Response> {

    return fetch(resource, init);

  }

  /**
   * Does a HTTP request and throws an exception if the server emitted
   * a HTTP error.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Request/Request
   */
  async fetchAndThrow(resource: string|Request, init?: RequestInit): Promise<Response> {

    const response = await this.fetch(resource, init);

    if (response.ok) {
      return response;
    } else {
      throw await problemFactory(response);
    }

  }

}
