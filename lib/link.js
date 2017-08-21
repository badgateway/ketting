var uriTemplate = require('uri-template');
var url = require('url');

/**
 * The Link object represents a hyperlink.
 *
 * @constructor
 * @property {string} rel - The relationship type.
 * @property {string} href - The URI of the link. Might be relative.
 * @property {string} baseHref - The base href of the parent document. Used
 *                               for expanding relative links.
 * @property {string} type - A mimetype
 * @property {boolean} templated - Whether it's a URI template or not.
 * @property {string} title - A human-readable label for the link.
 * @property {string} name - A name for the link. This might be used to
 *                           disambiguate the link.
 * @param {object} properties - The list of properties to initialize the link
 *                              with.
 */
var Link = function(properties) {

  this.templated = false;

  ['rel', 'baseHref', 'href', 'type', 'templated', 'title', 'name'].forEach(
    function(key) {
      if (properties[key]) {
        this[key] = properties[key];
      }
    }.bind(this)
  );

};

/**
 * Returns the absolute link url, based on it's base and relative url.
 *
 * @returns {string}
 */
Link.prototype.resolve = function() {

  return url.resolve(this.baseHref, this.href);

};

/**
 * Expands a link template (RFC6570) and resolves the uri
 *
 * @param {object} variables - A list of variables to expand the link with.
 * @returns {string}
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
