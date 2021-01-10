import { BaseHeadState } from './base-state';
import { parseLink } from '../http/util';
import Client from '../client';

/**
 * Turns the response to a HTTP Head request into a HeadState object.
 *
 * HeadState is a bit different from normal State objects, because it's
 * missing a bunch of information.
 */
export const factory = async (client: Client, uri: string, response: Response): Promise<BaseHeadState> => {

  const links = parseLink(uri, response.headers.get('Link'));

  return new BaseHeadState({
    client,
    uri,
    headers: response.headers,
    links,
  });

};
