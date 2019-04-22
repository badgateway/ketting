type UrlParts = {
  host?: string,
};

/**
 * Resolves a relative url using another url.
 *
 * This is the browser-based version.
 */
export function resolve(base: string, relative: string): string {

  // If the URL object is supported, we prefer that.
  if (typeof URL !== 'undefined') {
    return (new URL(relative, base).toString());
  }

  // Code taken from this gist:;
  // https://gist.github.com/johan/3915545#file-resolveurl-js

  const doc     = document;
  const oldBase = doc.getElementsByTagName('base')[0];
  const oldHref = oldBase && oldBase.href;
  const docHead = doc.head || doc.getElementsByTagName('head')[0];
  const ourBase = oldBase || docHead.appendChild(doc.createElement('base'));
  const resolver = doc.createElement('a');

  ourBase.href = base;
  resolver.href = relative;
  const resolvedUrl  = resolver.href; // browser magic at work here

  if (oldBase) {
    oldBase.href = oldHref;
  } else {
    docHead.removeChild(ourBase);
  }
  return resolvedUrl;

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
