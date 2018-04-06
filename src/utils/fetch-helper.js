'use strict';
var fetch = require('./fetch');

/**
 * Creates a Fetch Request object, based on a number of settings.
 *
 * @param {string|Request} input - Url or input request object.
 * @param {object} init - A list of Fetch settings
 * @param {object} defaultInit - A list of default settings to use if they
 *                              weren't overridden by init.
 * @return {Response}
 */
function createFetchRequest(
  input,
  init,
  defaultInit
) {

  var trueInit = {};

  if (init) {
    Object.assign(trueInit, defaultInit, init);
  } else {
    Object.assign(trueInit, defaultInit);
  }

  trueInit.headers = mergeHeaders([
    defaultInit.headers,
    input instanceof fetch.Request ? input.headers : null,
    init && init.headers ? init.headers : null
  ]);

  return new fetch.Request(input, trueInit);

}

/**
 * Merges sets of HTTP headers.
 *
 * Each item in the array is a key->value object, a Fetch Headers object
 * or falsey.
 *
 * Any headers that appear more than once get replaced. The last occurence
 * wins.
 *
 * @param {Object|undefined|fetch.Headers[]} headerSets
 * @return {fetch.Headers}
 */
function mergeHeaders(headerSets) {

  var result = new fetch.Headers();
  for(var headerSet of headerSets) {

    if (headerSet instanceof fetch.Headers) {
      for(var key of headerSet.keys()) {
        result.set(key, headerSet.get(key));
      }
    } else if (headerSet) {
      // not falsey, must be a key->value object.
      for(var index in headerSet) {
        result.set(index, headerSet[key]);
      }
    }
  }

  return result;

}

module.exports = {
  createFetchRequest: createFetchRequest,
  mergeHeaders: mergeHeaders
};
