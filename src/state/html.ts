import { BaseState } from './base-state';
import { StateFactory } from './interface';
import { HalResource, HalLink } from 'hal-types';
import { parseLink } from '../http/util';
import { Link, Links } from '../link';
import { resolve } from '../util/uri';
import { parseHtmlLinks } from '../util/html';

/**
 * Represents a resource state in the HAL format
 */
export class HtmlState extends BaseState<string> {

  serializeBody(): string {

    throw new Error('Reserializing HTML states is not yet supported. Please log an issue in the Ketting project to help figure out how this should be done');

  }

}

/**
 * Turns a HTTP response into a HtmlState
 */
export const factory: StateFactory = async (uri: string, response: Response): Promise<HtmlState> => {

  const body = await response.text();

  const links = parseLink(uri, response.headers.get('Link'));
  links.add(
    ...parseHtmlLinks(uri, body),
  );

  return new HtmlState(
    uri,
    body,
    response.headers,
    links,
  );

}
