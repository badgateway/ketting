import { Link } from '../link';

type UrlParts = {
  host?: string,
};

/**
 * Resolves a relative url using another url.
 *
 * This is the browser-based version.
 */
export function resolve(base: string, relative: string): string;
export function resolve(link: Link): string;
export function resolve(base: string|Link, relative?: string): string {

  if (typeof base !== 'string') {
    relative = base.href;
    base = base.context;
  } else {
    if (!relative) {
      return base;
    }
  }

  // If the URL object is supported, we prefer that.
  return (new URL(relative, base).toString());

}

/**
 * Parses a url in multiple components.
 *
 * This is the browser-based version.
 */
export function parse(url: string): UrlParts {

  const urlObj = new URL(url);
  return {
    host: urlObj.host,
  };

}
