import { State, HeadState } from './interface';
import { Links, LinkVariables, LinkNotFound } from '../link';
import Client from '../client';
import { Action, ActionNotFound, ActionInfo, SimpleAction } from '../action';
import { Resource } from '../resource';
import { resolve } from '../util/uri';
import { expand } from '../util/uri-template';
import { entityHeaderNames } from '../http/util';

type HeadStateInit = {

  client: Client;
  uri: string;
  links: Links;

  /**
   * The full list of HTTP headers that were sent with the response.
   */
  headers: Headers;
}

type StateInit<T> = {
  client: Client;
  uri: string;
  data: T;
  headers: Headers;
  links: Links;
  embedded?: State[];
  actions?: ActionInfo[];
}

/**
 * Implements a State object for HEAD responses
 */
export class BaseHeadState implements HeadState {

  uri: string;

  /**
   * Timestamp of when the State was first generated
   */
  timestamp: number;

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
  client: Client;

  constructor(init: HeadStateInit) {
    this.client = init.client;
    this.uri = init.uri;
    this.headers = init.headers;
    this.timestamp = Date.now();
    this.links = init.links;
  }

  /**
   * Follows a relationship, based on its reltype. For example, this might be
   * 'alternate', 'item', 'edit' or a custom url-based one.
   *
   * This function can also follow templated uris. You can specify uri
   * variables in the optional variables argument.
   */
  follow<TFollowedResource = any>(rel: string, variables?: LinkVariables): Resource<TFollowedResource> {

    const link = this.links.get(rel);
    if (!link) throw new LinkNotFound(`Link with rel ${rel} on ${this.uri} not found`);

    let href;

    if (link.templated) {
      href = expand(link, variables || {});
    } else {
      href = resolve(link);
    }
    if (link.hints?.status === 'deprecated') {
      /* eslint-disable-next-line no-console */
      console.warn(`[ketting] The ${link.rel} link on ${this.uri} is marked deprecated.`, link);
    }

    return this.client.go(href);

  }

  /**
   * Follows a relationship based on its reltype. This function returns a
   * Promise that resolves to an array of Resource objects.
   *
   * If no resources were found, the array will be empty.
   */
  followAll<TFollowedResource = any>(rel: string): Resource<TFollowedResource>[] {

    return this.links.getMany(rel).map( link => {

      if (link.hints?.status === 'deprecated') {
        /* eslint-disable-next-line no-console */
        console.warn(`[ketting] The ${link.rel} link on ${this.uri} is marked deprecated.`, link);
      }
      const href = resolve(link);
      return this.client.go(href);

    });

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

    const result: {[name: string]: string} = {};

    for(const contentHeader of entityHeaderNames) {
      if (this.headers.has(contentHeader)) {
        result[contentHeader] = this.headers.get(contentHeader)!;
      }
    }
    return new Headers(result);

  }

}

/**
 * The Base State provides a convenient way to implement a new State type.
 */
export class BaseState<T> extends BaseHeadState implements State<T> {


  data: T;

  protected embedded: State[];
  protected actionInfo: ActionInfo[];

  constructor(init: StateInit<T>) {

    super(init);
    this.data = init.data;
    this.actionInfo = init.actions || [];
    this.embedded = init.embedded || [];

  }

  /**
   * Return an action by name.
   *
   * If no name is given, the first action is returned. This is useful for
   * formats that only supply 1 action, and no name.
   */
  action<TFormData extends Record<string, any> = any>(name?: string): Action<TFormData> {

    if (!this.actionInfo.length) {
      throw new ActionNotFound('This State does not define any actions');
    }
    if (name === undefined) {
      return new SimpleAction(this.client, this.actionInfo[0]);
    }
    for(const action of this.actionInfo) {
      if (action.name === name) {
        return new SimpleAction(this.client, action);
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
  serializeBody(): Buffer|Blob|string {

    if (
      ((global as any).Buffer && this.data instanceof Buffer) ||
      ((global as any).Blob && this.data instanceof Blob) ||
      typeof this.data === 'string')
    {
      return this.data;
    }
    return JSON.stringify(this.data);

  }

  toJSON() {

    return this.data;

  }

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

  clone(): State<T> {

    return new BaseState({
      client: this.client,
      uri: this.uri,
      data: this.data,
      headers: new Headers(this.headers),
      links: new Links(this.links.defaultContext, this.links.getAll()),
      actions: this.actionInfo,
    });

  }

}
