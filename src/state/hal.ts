import { BaseState, StateFactory } from '../state';
import { HalResource } from 'hal-types';

/**
 * Takes a fetch HAL Response, and turns it into a State object
 */
export const factory: StateFactory = async (response: Response): Promise<HalState<HalResource>> => {

  return new HalState(
    await response.json(),
    response.headers
  );

}

export class HalState<T> extends BaseState<T> {

  serializeBody(): string {

    return JSON.stringify(this.body);

  }

}
