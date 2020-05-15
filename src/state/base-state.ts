import { State } from './interface';
import { Links } from '../link';
import Client from '../client';
import { Action, ActionNotFound } from '../action';

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
  data: T

  /**
   * The full list of HTTP headers that were sent with the response.
   */
  headers: Headers;

  /**
   * All links associated with the resource.
   */
  links: Links;

  /**
   * Reference to main client that created this state
   */
  client!: Client;

  /**
   * Embedded resoureces
   */
  protected embedded: State[];

  constructor(uri: string, data: T, headers: Headers, links: Links, embedded?: State[]) {

    this.uri = uri;
    this.data = data;
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
   * Return an action by name.
   *
   * If the format provides a default action, the name may be omitted.
   */
  action<TFormData = any>(name?: string): Action<TFormData> {

    throw new ActionNotFound('This State defines no action');

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

  abstract clone(): State<T>;

}
