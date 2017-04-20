var url = require('url');
var Resource = require('./resource');
var request = require('request-promise-any');
var package = require('../package.json');
var fetch = require('node-fetch');

var Client = function(bookMark, options) {

  if (typeof options === 'undefined') {
    options = {};
  }

  if (options.accept) {
    this.accept = options.accept;
  } else {
    this.accept = 'application/hal+json, application/json';
  }

  /* Note: all the following settings exists solely to provide backwards
   * compatibility for the Requests library, and will eventually be removed.
   */
  // json-promise-any setting, makes sure that we're getting whole responses
  // and not just the response body.
  options.resolveWithFullResponse = true;

  if (!options.headers) {
    options.headers = {};
  }
  if (!options.headers['User-Agent']) {
    options.headers['User-Agent'] = 'Restl/' + package.version;
  }
  if (!options.headers.Accept) {
    options.headers.Accept = 'application/hal+json, application/json';
  }

  // Parsing json by default.
  options.json = true;
  this.request = request.defaults(options);
  this.bookMark = bookMark;


};

Client.prototype = {

  /**
   * Here we store all the resources that were ever requested. This will
   * ensure that if the same resource is requested twice, the same object is
   * returned.
   */
  resourceCache : {},

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

  },

  /**
   * This function does an arbitrary request using the fetch API.
   *
   * Every request in restl is routed through here so it can be initialized
   * with some useful defaults.
   */
  fetch : function(input, init) {

    var request = new fetch.Request(input, init);
    if (!request.headers.has('User-Agent')) {
      request.headers.set('User-Agent', 'Restl/' + require('../package.json').version);
    }
    if (!request.headers.has('Accept')) {
      request.headers.set('Accept', this.accept);
    }

    return fetch(request);

  }

};

module.exports = Client;
