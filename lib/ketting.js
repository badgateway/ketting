var ClientOAuth2 = require('client-oauth2');
var Resource = require('./resource');
var representor = require('./representor');

var base64 = require('./utils/base64');
var oauth = require('./utils/oauth');
var fetch = require('./utils/fetch');
var url = require('./utils/url');

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

    if (options.auth.type == 'oauth2') {
      this.auth.oauthClient = new ClientOAuth2(options.auth.client);
    }
  }

  if (options.fetchInit) {
    this.fetchInit = options.fetchInit;
  }

  this.bookMark = bookMark;

};

Ketting.prototype = {

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
   * A list of settings passed to the Fetch API.
   *
   * It's effectively a list of defaults that are passed as the 'init' argument.
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Request/Request
   */
  fetchInit : {},

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
   * Returns a resource by its uri.
   *
   * This function doesn't do any HTTP requests. The uri is optional. If it's
   * not specified, it will return the bookmark resource.
   *
   * @param {string} uri - Optional uri.
   * @return {Resource}
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
   * This function does an arbitrary request using the fetch API.
   *
   * Every request in ketting is routed through here so it can be initialized
   * with some useful defaults.
   *
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/GlobalFetch}
   * @param {string|Request} input - Uri or Request object.
   * @param {object} init - A list of settings.
   * @return {Response}
   */
  fetch : function(input, init) {

    var newInit = {};

    if (init) {
      Object.assign(newInit, this.fetchInit, init);
    } else {
      newInit = this.fetchInit;
    }

    var request = new fetch.Request(input, newInit);
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
      case 'oauth2' :
        if (this.auth.accessToken) {
          request.headers.set('Authorization', 'Bearer ' + this.auth.accessToken);
        } else {
          return oauth.fetchToken(this, request)
            .then(function (ketting) {
              return ketting.fetch(input, init);
            });
        }
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

module.exports = Ketting;
