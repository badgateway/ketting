import { StateCache } from './';
import { State } from '../state';

/**
 * The NeverCache caches absolutely nothing.
 *
 * This should usually only be used in testing scenarios or if you really
 * know what you're doing.
 *
 * Using it could cause excessive requests, and will cause embedded items
 * to be ignored.
 */
export class NeverCache implements StateCache {

  /**
   * Store a State object.
   *
   * This function will clone the state object before storing
   */
  store(state: State) {}

  /**
   * Retrieve a State object from the cache by its absolute uri
   */
  get(uri: string): null {
    return null;
  }

  /**
   * Return true if a State object with the specified uri exists in the cache
   */
  has(uri: string): boolean {

    return false;

  }

  /**
   * Delete a State object from the cache, by its uri
   */
  delete(uri: string) {
  }

  /**
   * Purge the entire cache
   */
  clear() {
  }

}
