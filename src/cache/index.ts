export { ForeverCache } from './forever';
export { ShortCache } from './short';
import { State } from '../state';

/**
 * Cache interface
 *
 * The cache is responsible for storing 'state' objects
 */
export interface StateCache {

  /**
   * Store a State object.
   *
   * This function will clone the state object before storing
   */
  store: (state: State) => void;

  /**
   * Retrieve a State object from the cache by its absolute uri
   */
  get: (uri: string) => State | null;

  /**
   * Return true if a State object with the specified uri exists in the cache
   */
  has: (uri: string) => boolean;

  /**
   * Delete a State object from the cache, by its uri
   */
  delete: (uri: string) => void;

  /**
   * Purge the entire cache
   */
  clear: () => void;

}
