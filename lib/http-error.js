/**
 * HttpError extends the Error object, and is thrown wheenever servers emit
 * HTTP errors.
 *
 * It has a response property, allowing users to find out more about the
 * nature of the error.
 *
 * @constructor
 * @param {Response} response
 */
var HttpError = function(response) {

  this.response = response;
  this.status = response.status;
  this.message = 'HTTP error ' + this.status;

};

HttpError.prototype = Object.create(Error);

/**
 * Problem extends the HttpError object. If a server emits a HTTP error, and
 * the response body's content-type is application/problem+json.
 *
 * application/problem+json is defined in RFC7807 and provides a standardized
 * way to describe error conditions by a HTTP server.
 *
 * @constructor
 * @param {Response} response
 * @param {object} problemBody
 */
var Problem = function(response, problemBody) {

  HttpError.call(this, response);
  this.body = problemBody;
  if (this.body.title) {
    this.message = 'HTTP Error ' + this.status + ': ' + this.body.title;
  }

};

Problem.prototype = Object.create(HttpError);

/**
 * This function creates problems, not unlike the the author of this file.
 *
 * It takes a Fetch Response object, and returns a HttpError. If the HTTP
 * response has a type of application/problem+json it will return a Problem
 * object.
 *
 * Because parsing the response might be asynchronous, the function returns
 * a Promise resolving in either object.
 *
 * @async
 * @param {Response} response
 * @return {HttpError|Problem}
 */
var problemFactory = function(response) {

  var contentType = response.headers.get('Content-Type');
  if (contentType && contentType.match(/^application\/problem\+json/i)) {
    return response.json().then( function(problemBody) {

      return new Problem(response, problemBody);

    });
  } else {
    var error = new HttpError(response);
    return Promise.resolve(error);

  }

};

module.exports = problemFactory;
module.exports.HttpError = HttpError;
module.exports.Problem = Problem;
