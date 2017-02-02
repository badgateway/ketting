var Link = require('./link');

/**
 * The Representation object is the Resource Representation. This might be
 * response to a GET request.
 *
 * It typically includes the request body + a number of relevant http headers.
 */
var Representation = function(contentType, body) {

  this.contentType = contentType;
  this.body = body;
  this.links = [];

  if (typeof this.body._links !== 'undefined') {
    parseHALLinks(this);
  }
  if (typeof this.body._embedded !== 'undefined') {
    parseHALEmbedded(this);
  }

}

/**
 * Parse the HAL _links object and populate the 'links' property.
 */
var parseHALLinks = function(representation) {

  for(var relType in representation.body._links) {
    var links = representation.body._links[relType];
    if (!Array.isArray(links)) {
      links = [links];
    }
    for(var ii in links) {
      representation.links.push(
        new Link(
          relType,
          links[ii].href,
          links[ii].type
        )
      );
    }
  }

}

/**
 * Parse the HAL _embedded object. Right now we're just grabbing the
 * information from _embedded and turn it into links.
 */
var parseHALEmbedded = function(representation) {

  for(var relType in representation.body._embedded) {
    var embedded = representation.body._embedded[relType];
    if (!Array.isArray(embedded)) {
      embedded = [embedded];
    }
    for(var ii in embedded) {
      representation.links.push(
        new Link(
          relType,
          embedded[link]._links.self.href;
        )
      );
    }
}

module.exports = Representation;
