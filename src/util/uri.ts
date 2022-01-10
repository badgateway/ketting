import { Link } from '../link';

type UrlParts = {
  host?: string|null;
};

/**
 * Resolves a relative url using another url.
 *
 * This is the node.js version.
 */
export function resolve(base: string, relative: string): string;
export function resolve(link: Link): string;
export function resolve(arg1: string|Link, arg2?: string): string {


  // Normalize the 2 calling conventions
  let base, relative;
  if (typeof arg1==='string') {
    base = arg1;
    relative = arg2 as string;
  } else {
    base = arg1.context;
    relative = arg1.href;
  }

  // Our resolve function allows both parts to be relative, and new URL
  // requires the second argument to be absolute, so we wil use the RFC6761
  // 'invalid' domain as a base, so we can later strip it out.
  const newUrl = new URL(relative, new URL(base, 'http://ketting.invalid'));

  if (newUrl.hostname === 'ketting.invalid') {
    // Make the URL relative again if it contained 'ketting.invalid'
    return newUrl.pathname + newUrl.search + newUrl.hash;
  } else if (base.startsWith('//')) {
    // if the 'base' started with `//` it means it's a protocol-relative URL.
    // We want to make sure we retain that and don't accidentally add the `http`
    // from ketting.invalid
    return '//' + newUrl.host + newUrl.pathname + newUrl.search + newUrl.hash;
  } else {
    return newUrl.toString();
  }

}

/**
 * Parses a url in multiple components.
 *
 * This is the node.js version.
 */
export function parse(url: string): UrlParts {

  const parsed = new URL(url, 'http://ketting.invalid');
  if (parsed.hostname === 'ketting.invalid') {
    return {
      host: null
    }
  } else {
    return {
      host: parsed.host
    }
  }

}
