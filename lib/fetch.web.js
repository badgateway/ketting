/**
 * This file just exports the fetch API.
 *
 * It exists so a separate file can exist for the nodejs distribution (fetch.js).
 *
 * When webpack hits the 'fetch' dependency, it will use this file, but node.js
 * will hit 'fetch.js'.
 */
module.exports = function(input, init) {

  return fetch(input, init);

};

module.exports.Request = Request;
