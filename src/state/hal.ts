import { BaseState, StateFactory } from '../state';
import { HalResource } from 'hal-types';
import { parseLink } from '../http/util';


/**
 * Represents a resource state in the HAL format
 */
export class HalState<T> extends BaseState<T> {

  serializeBody(): string {

    return JSON.stringify(this.body);

  }

}

/**
 * Turns a HTTP response into a HalState
 */
export const factory: StateFactory = async (response: Response): Promise<HalState<HalResource>> => {

  return new HalState(
    await response.json(),
    response.headers,
    parseLink(response.headers.get('Link')),
  );

}
