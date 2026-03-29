import { BaseState } from './base-state.js';
import { StateFactory } from './interface.js';
import { parseLink } from '../http/util.js';

/**
 * Turns a HTTP response into a BinaryState
 */
export const factory: StateFactory<Blob> = async (client, uri, response): Promise<BaseState<Blob>> => {

  return new BaseState({
    client,
    uri,
    data: await response.blob(),
    headers: response.headers,
    links: parseLink(uri, response.headers.get('Link')),
  });

};
