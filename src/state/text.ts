import { BaseState } from './base-state';
import { StateFactory } from './interface';
import { parseLink } from '../http/util';
import Client from '../client';

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
