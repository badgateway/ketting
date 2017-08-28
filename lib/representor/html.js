var Representation = require('./base');
var Link = require('../link');
var sax = require('sax');

/**
 * The Representation class is basically a 'body' of a request
 * or response.
 *
 * This class is for HTML responses. The html.web.js version is the version
 * intended for browsers. The regular html.js is intended for node.js.
 *
 * @constructor
 * @param {string} uri
 * @param {string} contentType - Mime type
 * @param {string} body - Response body
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

      var link = new Link({
        rel: rel,
        baseHref: this.uri,
        href: node.attributes.HREF,
        type: node.attributes.TYPE
      });
      this.links.push(link);

    }.bind(this));

  }.bind(this);

  parser.write(body).close();

};

Html.prototype = Object.create(Representation);

module.exports = Html;
