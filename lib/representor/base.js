/**
 * The Representation class is basically a 'body' of a request
 * or response.
 *
 * This is base class for a representation.
 *
 * @param {string} uri
 * @param {string} contentType - Mime type
 * @param {string} body - Response body
 */
var Representation = function(uri, contentType, body) {

  this.uri = uri;
  this.contentType = contentType;
  this.body = body;
  this.links = [];
  this.embedded = {};


};

module.exports = Representation;
