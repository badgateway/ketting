import { State } from './interface';
import { Links } from '../link';

export abstract class BaseState<T> implements State<T> {

  /**
   * The URI associated with this state
   */
  uri: string;

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

  /**
   * Embedded resoureces
   */
  protected embedded: State[];

  constructor(uri: string, body: T, headers: Headers, links: Links, embedded?: State[]) {

    this.uri = uri;
    this.body = body;
    this.headers = headers;
    this.links = links;
    this.embedded = embedded || [];
    this.timestamp = Date.now();

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

  /**
   * Certain formats can embed other resources, identified by their
   * own URI.
   *
   * When a format has embedded resources, we will use these to warm
   * the cache.
   *
   * This method returns every embedded resource.
   */
  getEmbedded(): State[] {

    return this.embedded;

  }

  /**
   * Timestamp of when the State was first generated
   */
  timestamp: number;

}
