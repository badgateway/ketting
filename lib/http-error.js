/**
 * HttpError extends the Error object, and is thrown wheenever servers emit
 * HTTP errors.
 *
 * It has a response property, allowing users to find out more about the
 * nature of the error.
 */
var HttpError = function(response) {

  this.response = response;
  this.status = response.status;
  this.message = 'HTTP error ' + this.status;

};

HttpError.prototype = Object.create(Error);
module.exports = HttpError;
