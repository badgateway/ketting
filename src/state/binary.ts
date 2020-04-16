import { BaseState, StateFactory } from '../state';

/**
 * Represents a binary resource state.
 *
 * This is used for responses like images, video, etc.
 */
export const factory: StateFactory<Blob> = async (response: Response): Promise<BinaryState> => {

  return new BinaryState(
    await response.blob(),
    response.headers
  );

}


export class BinaryState extends BaseState<Blob> {

  serializeBody(): Blob {

    return this.body;

  }

}
