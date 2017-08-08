var Representation = require('./base');
var Link = require('../link');
var sax = require('sax');

/**
 * The Representation class is basically a 'body' of a request
 * or response.
 *
 * This class is for HTML responses.
 */
var Html = function(uri, contentType, body) {

  Representation.call(this, uri, contentType, body);

  var parser = sax.parser(false);

  parser.onopentag = function(node) {

    if (!node.attributes.REL) {
      return;
    }
    if (!node.attributes.HREF) {
      return;
    }

    node.attributes.REL.split(' ').forEach(function(rel) {

      var link = new Link(
        rel,
        this.uri,
        node.attributes.HREF,
        node.attributes.TYPE,
        false
      );
      this.links.push(link);

    }.bind(this));

  }.bind(this);

  parser.write(body).close();

};

Html.prototype = Object.create(Representation);

module.exports = Html;
