import { resolve as r } from 'url';

/**
 * Resolves a relative url using another url.
 *
 * This is the node.js version.
 */
export function resolve(base: string, relative: string): string {

  return r(base, relative);

}

