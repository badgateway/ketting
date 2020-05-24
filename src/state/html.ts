import { BaseState } from './base-state';
import { StateFactory } from './interface';
import { parseLink } from '../http/util';
import { parseHtml } from '../util/html';
import { Links } from '../link';

/**
 * Represents a resource state in the HAL format
 */
export class HtmlState extends BaseState<string> {

  serializeBody(): string {

    throw new Error('Reserializing HTML states is not yet supported. Please log an issue in the Ketting project to help figure out how this should be done');

  }

  clone(): HtmlState {

    return new HtmlState(
      this.uri,
      this.data,
      new Headers(this.headers),
      new Links(this.links)
    );

  }

}

/**
 * Turns a HTTP response into a HtmlState
 */
export const factory: StateFactory = async (uri: string, response: Response): Promise<HtmlState> => {

  const body = await response.text();

  const links = parseLink(uri, response.headers.get('Link'));
  const htmlResult = parseHtml(uri, body);
  links.add(...htmlResult.links);

  return new HtmlState(
    uri,
    body,
    response.headers,
    links,
  );

}
