var url = require('url');
var Resource = require('./resource');
var fetch = require('./fetch');
var representor = require('./representor');
var base64 = require('./base64');

/**
 * The main Ketting client object.
 *
 * @constructor
 * @class
 * @param {string} bookMark - Bookmark or 'base' uri.
 * @param {object} options - List of options
 */
var Ketting = function(bookMark, options) {

  if (typeof options === 'undefined') {
    options = {};
  }
  this.resourceCache = {};

  this.contentTypes = [
    {
      mime: 'application/hal+json',
      representor: 'hal',
    },
    {
      mime: 'application/json',
      representor: 'hal',
    },
    {
      mime: 'text/html',
      representor: 'html',
    }
  ];

  if (options.auth) {
    this.auth = options.auth;
  }

  this.bookMark = bookMark;

};

Client.prototype = {

  /**
   * Here we store all the resources that were ever requested. This will
   * ensure that if the same resource is requested twice, the same object is
   * returned.
   */
  resourceCache : null,

  /**
   * Autentication settings.
   *
   * If set, must have at least a `type` property.
   * If type=basic, userName and password must be set.
   */
  auth: null,

  /**
   * Content-Type settings and mappings.
   *
   * See the constructor for an example of the structure.
   */
  contentTypes: [],

  /**
   * Returns a resource by its uri.
   *
   * This function doesn't do any HTTP requests.
   */
  getResource: function(uri) {

    if (typeof uri === 'undefined') {
      uri = '';
    }
    uri = url.resolve(this.bookMark, uri);

    if (!this.resourceCache[uri]) {
      this.resourceCache[uri] = new Resource(this, uri);
    }

    return this.resourceCache[uri];

  },

  /**
   * This function is a shortcut for getResource().follow(x);
   *
   * @async
   * @param {string} rel - Relationship
   * @param {object} variables - Templated variables for templated links.
   * @returns {Resource}
   */
  follow: function(rel, variables) {

    return this.getResource().follow(rel, variables);

  },

  /**
   * This function does an arbitrary request using the fetch API.
   *
   * Every request in ketting is routed through here so it can be initialized
   * with some useful defaults.
   */
  fetch : function(input, init) {

    var request = new fetch.Request(input, init);
    if (!request.headers.has('User-Agent')) {
      request.headers.set('User-Agent', 'Ketting/' + require('../package.json').version);
    }
    if (!request.headers.has('Accept')) {
      var accept = this.contentTypes
        .map( function(contentType) { return contentType.mime; } )
        .join(',');
      request.headers.set('Accept', accept);
    }
    if (!request.headers.has('Content-Type')) {
      request.headers.set('Content-Type', this.contentTypes[0].mime);
    }
    if (!request.headers.has('Authorization') && this.auth) {
      switch(this.auth.type) {

      case 'basic' :
        request.headers.set('Authorization', 'Basic ' + base64.encode(this.auth.userName + ':' + this.auth.password));
        break;
      case 'bearer' :
        request.headers.set('Authorization', 'Bearer ' + this.auth.token);
        break;

      }

    }

    return fetch(request);

  },

  /**
   * This function returns a representor constructor for a mime type.
   *
   * For example, given text/html, this function might return the constructor
   * stored in representor/html.
   *
   * @param {String} contentType
   * @return {Function}
   */
  getRepresentor : function(contentType) {

    if (contentType.indexOf(';') !== -1) {
      contentType = contentType.split(';')[0];
    }
    contentType = contentType.trim();
    var result = this.contentTypes.find(function(item) {
      return item.mime === contentType;
    });

    if (!result) {
      throw new Error('Could not find a representor for contentType: ' + contentType);
    }

    switch(result.representor) {
    case 'html' :
      return representor.html;
    case 'hal' :
      return representor.hal;
    default :
      throw new Error('Unknown representor: ' + result.representor);

    }

  }

};

module.exports = Client;
