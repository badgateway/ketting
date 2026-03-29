import { BaseState } from './base-state.js';
import { StateFactory } from './interface.js';
import { parseLink } from '../http/util.js';
import Client from '../client.js';

/**
 * Turns a HTTP response into a TextState
 */
export const factory: StateFactory<string> = async (client: Client, uri: string, response: Response): Promise<BaseState<string>> => {

  return new BaseState({
    client,
    uri,
    data: await response.text(),
    headers: response.headers,
    links: parseLink(uri, response.headers.get('Link')),
  });

};
