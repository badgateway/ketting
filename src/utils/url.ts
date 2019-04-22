import { parse as p, resolve as r } from 'url';

type UrlParts = {
  host?: string,
};

/**
 * Resolves a relative url using another url.
 *
 * This is the node.js version.
 */
export function resolve(base: string, relative: string): string {

  return r(base, relative);

}

/**
 * Parses a url in multiple components.
 *
 * This is the node.js version.
 */
export function parse(url: string): UrlParts {

  return p(url);

}
