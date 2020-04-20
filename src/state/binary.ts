import { BaseState } from './base-state';
import { StateFactory } from './interface';
import { parseLink } from '../http/util';

/**
 * Represents a binary resource state.
 *
 * This is used for responses like images, video, etc.
 */
export class BinaryState extends BaseState<Blob> {

  serializeBody(): Blob {

    return this.body;

  }

}

/**
 * Turns a HTTP response into a BinaryState
 */
export const factory: StateFactory<Blob> = async (uri: string, response: Response): Promise<BinaryState> => {

  return new BinaryState(
    uri,
    await response.blob(),
    response.headers,
    parseLink(uri, response.headers.get('Link')),
  );

}
