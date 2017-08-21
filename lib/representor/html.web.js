var Representation = require('./base');
var Link = require('../link');

/**
 * The Representation class is basically a 'body' of a request
 * or response.
 *
 * This class is for HTML responses. The html.web.js version is the version
 * intended for browsers. The regular html.js is intended for node.js.
 */
var Html = function(uri, contentType, body) {

  Representation.call(this, uri, contentType, body);

  var parser = new DOMParser();
  var doc = parser.parseFromString(body, 'text/html');

  linkFromTags(
    this,
    doc.getElementsByTagName('link')
  );

  linkFromTags(
    this,
    doc.getElementsByTagName('a')
  );

};

function linkFromTags(htmlDoc, elements) {

  for(var ii=0; ii < elements.length; ii++) {

    var node = elements[ii];

    var rels = node.getAttribute('rel');
    var href = node.getAttribute('href');
    var type = node.getAttribute('type');

    if (!rels || !href) {
      continue;
    }

    rels.split(' ').forEach(function(rel) {

      var link = new Link(
        rel,
        htmlDoc.uri,
        href,
        type,
        false
      );
      htmlDoc.links.push(link);

    });

  }

}

Html.prototype = Object.create(Representation);

module.exports = Html;
