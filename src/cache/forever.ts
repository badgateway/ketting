import { StateCache } from './';
import { State } from '../state';

/**
 * The 'Forever' cache stores any State for as long as the application
 * lives.
 *
 * It is a good default for most applications, but it means that if
 * a resource was changed server-side, Ketting will not pick up that change
 * until something was done to expire caches.
 *
 * Executing an unsafe method, calling clearCache() on a resource, or
 * when a resource appears in Location, Content-Location, or "invalidates"
 * link relationships.
 */
export class ForeverCache implements StateCache {

  private cache: Map<string, State>;

  constructor() {
    this.cache = new Map();
  }

  /**
   * Store a State object.
   *
   * This function will clone the state object before storing
   */
  store(state: State) {
    this.cache.set(
      state.uri,
      state.clone()
    );
  }

  /**
   * Retrieve a State object from the cache by its absolute uri
   */
  get(uri: string): State | null {

    const state = this.cache.get(uri);
    if (!state) {
      return null;
    }
    return state.clone();

  }

  /**
   * Return true if a State object with the specified uri exists in the cache
   */
  has(uri: string): boolean {

    return this.cache.has(uri);

  }

  /**
   * Delete a State object from the cache, by its uri
   */
  delete(uri: string) {
    this.cache.delete(uri);
  }

  /**
   * Purge the entire cache
   */
  clear() {
    this.cache.clear();
  }

}
