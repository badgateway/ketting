import url  from 'url';

/**
 * Resolves a relative url using another url.
 *
 * This is the node.js version.
 */
export function resolve(base: string, relative: string): string {

  return url.resolve(base, relative);

}

