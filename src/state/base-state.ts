import { State } from './interface';
import { Links } from '../link';
import Client from '../client';
import { Action, ActionNotFound, ActionInfo, SimpleAction } from '../action';

/**
 * The Base State provides a convenient way to implement a new State type.
 */
export abstract class BaseState<T> implements State<T> {

  /**
   * Timestamp of when the State was first generated
   */
  timestamp: number;

  /**
   * Reference to main client that created this state
   */
  client!: Client;

  constructor(
    public uri: string,
    public data: T,
    public headers: Headers,
    public links: Links,
    protected embedded: State[] = [],
    protected actionInfo: ActionInfo[] = []) {

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
      'ETag',
      'Last-Modified',
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
   * If no name is given, the first action is returned. This is useful for
   * formats that only supply 1 action, and no name.
   */
  action<TFormData = any>(name?: string): Action<TFormData> {

    if (!this.actionInfo.length) {
      throw new ActionNotFound('This State does not define any actions');
    }
    if (name === undefined) {
      return new SimpleAction(this.client, this.actionInfo[0]);
    }
    for(const action of this.actionInfo) {
      if (action.name === name) {
        return new SimpleAction(this.client, this.actionInfo[0]);
      }
    }
    throw new ActionNotFound('This State defines no action');

  }

  /**
   * Returns all actions
   */
  actions(): Action[] {

    return this.actionInfo.map(action => new SimpleAction(this.client, action));

  }

  /**
   * Checks if the specified action exists.
   *
   * If no name is given, checks if _any_ action exists.
   */
  hasAction(name?: string): boolean {

    if (name===undefined) return this.actionInfo.length>0;
    for(const action of this.actionInfo) {
      if (name === action.name) {
        return true;
      }
    }
    return false;

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

  abstract clone(): State<T>;

}
