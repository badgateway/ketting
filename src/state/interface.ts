import { Action } from '../action';
import { Links, LinkVariables } from '../link';
import Client from '../client';
import { Resource } from '../resource';

export type State<T = any> = {

  /**
   * The URI associated with this state
   */
  uri: string;

  /**
   * Represents the body of the HTTP response.
   *
   * In the case of a JSON response, this will be deserialized
   */
  data: T;

  /**
   * All links associated with the resource.
   */
  links: Links;

  /**
   * The full list of HTTP headers that were sent with the response.
   */
  headers: Headers;

  /**
   * Reference to main client that created this state
   */
  client: Client;

  /**
   * Follows a relationship, based on its reltype. For example, this might be
   * 'alternate', 'item', 'edit' or a custom url-based one.
   *
   * This function can also follow templated uris. You can specify uri
   * variables in the optional variables argument.
   */
  follow<TFollowedResource = any>(rel: string, variables?: LinkVariables): Resource<TFollowedResource>;

  /**
   * Follows a relationship based on its reltype. This function returns a
   * Promise that resolves to an array of Resource objects.
   *
   * If no resources were found, the array will be empty.
   */
  followAll<TFollowedResource = any>(rel: string): Resource<TFollowedResource>[];

  /**
   * Return an action by name.
   *
   * If the format provides a default action, the name may be omitted.
   */
  action<TFormData extends Record<string, any> = any>(name?: string): Action<TFormData>;

  /**
   * Returns all actions
   */
  actions(): Action[];

  /**
   * Checks if the specified action exists.
   *
   * If no name is given, checks if _any_ action exists.
   */
  hasAction(name?: string): boolean;

  /**
   * Returns a serialization of the state that can be used in a HTTP
   * response.
   *
   * For example, a JSON object might simply serialize using
   * JSON.serialize().
   */
  serializeBody(): Buffer|Blob|string;

  /**
   * Returns a JSON of the state that can be used in a HTTP response.
   */
  toJSON(): any;

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
   * Some formats support embedding resources inside other resources.
   *
   * Please note: generally you should always use the .follow() and
   * .followAll() functions to get access to linked embedded resources.
   *
   * There's several operations that change the State in the Ketting Cache,
   * and usually this erases any associated embedded resources.
   *
   * .follow() and .followAll() will return the embedded resources, and also
   * keeps their respective states fresh when changes are made.
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
export type HeadState = Omit<State, 'data' | 'action' | 'actions' | 'hasAction' | 'serializeBody' | 'toJSON' | 'getEmbedded' | 'client' | 'clone'>;

/**
 * A 'StateFactory' is responsible for taking a Fetch Response, and returning
 * an object that impements the State interface
 */
export type StateFactory<T = any> = (client: Client, uri: string, request: Response) => Promise<State<T>>;

export function isState(input: Record<string, any>): input is State {

  return (
    typeof (input as any).uri === 'string' &&
    (input as any).links instanceof Links &&
    (input as any).headers instanceof Headers
  );

}
