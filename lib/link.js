var uriTemplate = require('uri-template');
var url = require('url');

var Link = function(rel, baseHref, href, type, templated) {

  this.rel = rel;
  this.baseHref = baseHref;
  this.href = href;
  this.type = type ? type : null;
  this.templated = templated;

};

/**
 * Returns the absolute link url, based on it's base and relative url.
 */
Link.prototype.resolve = function() {

  return url.resolve(this.baseHref, this.href);

};

/**
 * Expands a link template (RFC6570) and resolves the uri
 */
Link.prototype.expand = function(variables) {

  var templ, expanded;
  if (!this.templated) {
    return url.resolve(this.baseHref, this.href);
  } else {
    templ = uriTemplate.parse(this.href);
    expanded = templ.expand(variables);
    return url.resolve(this.baseHref, expanded);
  }

};

module.exports = Link;
