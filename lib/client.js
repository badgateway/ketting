var url = require('url');
var Resource = require('./resource');
var request = require('request-promise-any');
var package = require('../package.json');

var Client = function(bookMark, requestOptions) {

  if (typeof requestOptions === 'undefined') {
    requestOptions = {};
  }
  // json-promise-any setting, makes sure that we're getting whole responses
  // and not just the response body.
  requestOptions.resolveWithFullResponse = true;

  // Default headers.
  requestOptions.headers = {
    'User-Agent' : 'Restl/' + package.version,
    'Accept'     : 'application/hal+json, application/json' 
  };

  // Parsing json by default.
  requestOptions.json = true;
  this.request = request.defaults(requestOptions);
  this.bookMark = bookMark;

};

Client.prototype = {

  getResource: function(uri) {

    if (typeof uri === 'undefined') {
      uri = '';
    }
    uri = url.resolve(this.bookMark, uri);
    return new Resource(this, uri);

  }

};

module.exports = Client;
