import { BaseState } from './base-state';
import { StateFactory } from './interface';
import { parseLink } from '../http/util';
import { Links } from '../link';

/**
 * Represents a resource state for text responses, such as text/plain, text/csv.
 * text/html, text/csv.
 */
export class TextState extends BaseState<string> {

  serializeBody(): string {

    return this.data;

  }

  clone(): TextState {

    return new TextState(
      this.uri,
      this.data,
      new Headers(this.headers),
      new Links(this.uri, this.links),
    );

  }

}

/**
 * Turns a HTTP response into a TextState
 */
export const factory: StateFactory<string> = async (uri: string, response: Response): Promise<TextState> => {

  return new TextState(
    uri,
    await response.text(),
    response.headers,
    parseLink(uri, response.headers.get('Link')),
  );

}
