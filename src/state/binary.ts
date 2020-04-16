import { BaseState, StateFactory } from '../state';
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
export const factory: StateFactory<Blob> = async (response: Response): Promise<BinaryState> => {

  return new BinaryState(
    await response.blob(),
    response.headers,
    parseLink(response.headers.get('Link')),
  );

}
