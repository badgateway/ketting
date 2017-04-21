var url = require('url');
var Resource = require('./resource');
var request = require('request-promise-any');
var package = require('../package.json');

var Client = function(bookMark, requestOptions) {

  this.resourceCache = {};

  if (typeof requestOptions === 'undefined') {
    requestOptions = {};
  }
  // json-promise-any setting, makes sure that we're getting whole responses
  // and not just the response body.
  requestOptions.resolveWithFullResponse = true;

  if (!requestOptions.headers) {
    requestOptions.headers = {};
  }
  if (!requestOptions.headers['User-Agent']) {
    requestOptions.headers['User-Agent'] = 'Restl/' + package.version;
  }
  if (!requestOptions.headers.Accept) {
    requestOptions.headers.Accept = 'application/hal+json, application/json';
  }

  // Parsing json by default.
  requestOptions.json = true;
  this.request = request.defaults(requestOptions);
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
   * This funciton is a shortcut for getResource().follow(x);
   *
   * This function returns a resource
   */
  follow: function(rel) {

    return this.getResource().follow(rel);

  }

};

module.exports = Client;
