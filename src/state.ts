import { Links } from './link';

export interface State<T = any> {

  /**
   * Represents the body of the HTTP response.
   *
   * In the case of a JSON response, this will be deserialized
   */
  body: T

  /**
   * All links associated with the resource.
   */
  links: Links,

  /**
   * The full list of HTTP headers that were sent with the response.
   */
  headers: Headers;

  /**
   * Returns a serialization of the state that can be used in a HTTP
   * response.
   *
   * For example, a JSON object might simply serialize using
   * JSON.serialize().
   */
  serializeBody(): Buffer|Blob|string;

  /**
   * Content-headers are a subset of HTTP headers that related directly
   * to the content. The obvious ones are Content-Type.
   *
   * This set of headers will be sent by the server along with a GET
   * response, but will also be sent back to the server in a PUT
   * request.
   */
  contentHeaders(): Headers;


}

export abstract class BaseState<T> implements State<T> {

  /**
   * Represents the body of the HTTP response.
   *
   * In the case of a JSON response, this will be deserialized
   */
  body: T

  /**
   * The full list of HTTP headers that were sent with the response.
   */
  headers: Headers;

  /**
   * All links associated with the resource.
   */
  links: Links;

  constructor(body: T, headers: Headers, links: Links) {

    this.body = body;
    this.headers = headers;
    this.links = links;

  }

  /**
   * Content-headers are a subset of HTTP headers that related directly
   * to the content. The obvious ones are Content-Type.
   *
   * This set of headers will be sent by the server along with a GET
   * response, but will also be sent back to the server in a PUT
   * request.
   */
  contentHeaders(): Headers {

    const contentHeaderNames = [
      'Content-Type',
      'Content-Language',
    ];

    const result: {[name: string]: string} = {};

    for(const contentHeader of contentHeaderNames) {
      if (this.headers.has(contentHeader)) {
        result[contentHeader] = this.headers.get(contentHeader)!;
      }
    }
    return new Headers(result);

  }

  /**
   * Returns a serialization of the state that can be used in a HTTP
   * response.
   *
   * For example, a JSON object might simply serialize using
   * JSON.serialize().
   */
  abstract serializeBody(): Buffer|Blob|string;

}

/**
 * A 'StateFactory' is responsible for taking a Fetch Response, and returning
 * an object that impements the State interface
 */
export type StateFactory<T = any> = (request: Response) => Promise<State<T>>;
