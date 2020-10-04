import {Action} from '../action';
import { Links } from '../link';
import Client from '../client';

export interface State<T = any> {

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
   * All links associated with the resource.
   */
  links: Links,

  /**
   * The full list of HTTP headers that were sent with the response.
   */
  headers: Headers;

  /**
   * Reference to main client that created this state
   */
  client: Client;

  /**
   * Return an action by name.
   *
   * If the format provides a default action, the name may be omitted.
   */
  action<TFormData = any>(name?: string): Action<TFormData>;

  /**
   * Returns all actions
   */
  actions(): Action[];

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

  /**
   * Certain formats can embed other resources, identified by their
   * own URI.
   *
   * When a format has embedded resources, we will use these to warm
   * the cache.
   *
   * This method returns every embedded resource.
   */
  getEmbedded(): State[];

  /**
   * Timestamp of when the State was first generated
   */
  timestamp: number;

  clone(): State<T>;

}

/**
 * HeadState represents the response to a HEAD request.
 *
 * Some information in HEAD responses might be available, but many aren't.
 * Notably, the body.
 */
export interface HeadState {

  /**
   * The URI associated with this state
   */
  uri: string;

  /**
   * All links associated with the resource.
   */
  links: Links,

  /**
   * The full list of HTTP headers that were sent with the response.
   */
  headers: Headers;

  /**
   * Content-headers are a subset of HTTP headers that related directly
   * to the content. The obvious ones are Content-Type.
   *
   * This set of headers will be sent by the server along with a GET
   * response, but will also be sent back to the server in a PUT
   * request.
   */
  contentHeaders(): Headers;

  /**
   * Timestamp of when the State was first generated
   */
  timestamp: number;

}

/**
 * A 'StateFactory' is responsible for taking a Fetch Response, and returning
 * an object that impements the State interface
 */
export type StateFactory<T = any> = (uri: string, request: Response) => Promise<State<T>>;

export function isState(input: Record<string, any>): input is State {

  return (
    typeof (input as any).uri === 'string' &&
    (input as any).links instanceof Links &&
    (input as any).headers instanceof Headers
  );

}
