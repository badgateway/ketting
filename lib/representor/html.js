var Representation = require('./base');
var Link = require('../link');
var url = require('url');

/**
 * The Representation class is basically a 'body' of a request
 * or response.
 *
 * This class is for HTML responses.
 */
var Html = function(uri, contentType, body) {

  Representation.call(this, uri, contentType, body);

  var re = /<link rel="([^"]+)" href="([^"]+)" \/>/g;
  var match;

  do {
    match = re.exec(body);
    if (match) {
      this.links.push(
        new Link(
          match[1],
          this.uri,
          match[2],
          null,
          false
        )
      );
    }

  } while(match);

}

Html.prototype = Object.create(Representation);

module.exports = Html;
