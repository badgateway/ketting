var Link = require('./link');

var Representation = function(contentType, body) {

  this.contentType = contentType;
  this.body = body;
  this.links = [];

  if (typeof this.body._links !== 'undefined') {
    parseHALLinks(this);
  }

}

var parseHALLinks = function(representation) {

  for(relType in representation.body._links) {
    var links = representation.body._links[relType];
    if (!Array.isArray(links)) {
      links = [links];
    }
    for(link in links) {
      representation.links.push(
        new Link(
          relType,
          links[link].href,
          links[link].type
        )
      );
    } 
  }

}



module.exports = Representation;
