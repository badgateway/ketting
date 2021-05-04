import { parse as p, resolve as r } from 'url';
import { Link } from '../link';

type UrlParts = {
  host?: string|null,
};

/**
 * Resolves a relative url using another url.
 *
 * This is the node.js version.
 */
export function resolve(base: string, relative: string): string;
export function resolve(link: Link): string;
export function resolve(base: string|Link, relative?: string): string {

  if (typeof base === 'string') {
    return r(base, relative!);
  } else {
    return r(base.context, base.href);
  }

}

/**
 * Parses a url in multiple components.
 *
 * This is the node.js version.
 */
export function parse(url: string): UrlParts {

  return p(url);

}
