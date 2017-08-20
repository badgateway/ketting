var HttpError = require('./http-error');

/**
 * Problem extends the HttpError object. If a server emits a HTTP error, and
 * the response body's content-type is application/problem+json.
 *
 * application/problem+json is defined in RFC7807 and provides a standardized
 * way to describe error conditions by a HTTP server.
 */
var Problem = function(response, problemBody) {

  HttpError.call(this, response);
  this.body = problemBody;
  if (this.body.title) {
    this.message = 'HTTP Error ' + this.status + ': ' + this.body.title;
  }

};

Problem.prototype = Object.create(HttpError);
module.exports = Problem;
