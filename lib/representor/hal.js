var Representation = require('./base');
var Link = require('../link');
var url = require('../utils/url');

/**
 * The Representation class is basically a 'body' of a request
 * or response.
 *
 * This class is for HAL JSON responses.
 *
 * @constructor
 * @extends Base
 * @param {string} uri
 * @param {string} contentType
 * @param {string} body
 * @property {object} body - The parsed JSON body
 * @property {object} embedded - A list of embedded resources.
 */
var Hal = function(uri, contentType, body) {

  Representation.call(this, uri, contentType, body);

  if (typeof body === 'string') {
    this.body = JSON.parse(body);
  } else {
    this.body = body;
  }

  if (typeof this.body._links !== 'undefined') {
    parseHalLinks(this);
  }
  if (typeof this.body._embedded !== 'undefined') {
    parseHalEmbedded(this);
  }

  delete this.body._links;
  delete this.body._embedded;

};

Hal.prototype = Object.create(Representation);

/**
 * Parse the Hal _links object and populate the 'links' property.
 *
 * @param {Hal} representation
 * @return {void}
 */
var parseHalLinks = function(representation) {

  for(var relType in representation.body._links) {

    var links = representation.body._links[relType];
    if (!Array.isArray(links)) {
      links = [links];
    }
    parseHalLink(representation, relType, links);

  }

};

/**
 * Parses a single HAL link from a _links object, or a list of links.
 *
 * @param {Hal} representation
 * @param {string} rel - Relationship type
 * @param {Link|Link[]} links - Link object(s)
 * @returns {void}
 */
var parseHalLink = function(representation, rel, links) {

  for(var ii in links) {
    representation.links.push(
      new Link({
        rel: rel,
        baseHref: representation.uri,
        href: links[ii].href,
        type: links[ii].type,
        templated: links[ii].templated,
        name: links[ii].name
      })
    );
  }

};

/**
 * Parse the HAL _embedded object. Right now we're just grabbing the
 * information from _embedded and turn it into links.
 *
 * @param {Hal} representation
 * @return {void}
 */
var parseHalEmbedded = function(representation) {

  for(var relType in representation.body._embedded) {

    var embedded = representation.body._embedded[relType];
    if (!Array.isArray(embedded)) {
      embedded = [embedded];
    }
    for(var ii in embedded) {

      var uri = url.resolve(
        representation.uri,
        embedded[ii]._links.self.href
      );

      representation.links.push(
        new Link({
          rel: relType,
          baseHref: representation.uri,
          href: embedded[ii]._links.self.href
        })
      );

      representation.embedded[uri] = embedded[ii];

    }
  }
};

module.exports = Hal;
