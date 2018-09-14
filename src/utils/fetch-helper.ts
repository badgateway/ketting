import './fetch-polyfill';

/**
 * Creates a Fetch Request object, based on a number of settings.
 *
 * @param {string|Request} input - Url or input request object.
 * @param {object} init - A list of Fetch settings
 * @param {object} defaultInit - A list of default settings to use if they
 *                              weren't overridden by init.
 * @return {Response}
 */
export function createFetchRequest(input: any, init: any, defaultInit: any): Request {

  const trueInit: any = {};

  if (init) {
    Object.assign(trueInit, defaultInit, init);
  } else {
    Object.assign(trueInit, defaultInit);
  }

  trueInit.headers = mergeHeaders([
    defaultInit ? defaultInit.headers : null,
    // @ts-ignore cross-fetch definitions are broken. See https://github.com/lquixada/cross-fetch/pull/19
    input instanceof Request ? input.headers : null,
    init && init.headers ? init.headers : null
  ]);

    // @ts-ignore cross-fetch definitions are broken. See https://github.com/lquixada/cross-fetch/pull/19
  return new Request(input, trueInit);

}

type HeaderSet = any;

/**
 * Merges sets of HTTP headers.
 *
 * Each item in the array is a key->value object, a Fetch Headers object
 * or falsey.
 *
 * Any headers that appear more than once get replaced. The last occurence
 * wins.
 */
export function mergeHeaders(headerSets: HeaderSet[]): Headers {

  const result = new Headers();
  for (const headerSet of headerSets) {

    if (headerSet instanceof Headers) {
      for (const key of headerSet.keys()) {
        result.set(key, <string> headerSet.get(key));
      }
    } else if (headerSet) {
      // not falsey, must be a key->value object.
      for (const index of Object.keys(headerSet)) {
        result.set(index, headerSet[index]);
      }
    }
  }

  return result;

}
