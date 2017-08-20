'use strict';

/**
 * The FollowablePromise is a Promise that adds the follow and followAll
 * functions.
 *
 * It's really just a thin wrapper around the promise. Note that we're not
 * extending the built-in Promise object, but proxy it as browsers don't allow
 * extending the Promise object.
 *
 * @param {Function} executor
 */
var FollowablePromise = function(executor) {

  this.realPromise = new Promise(executor);

};

FollowablePromise.prototype = {

  /**
   * The then function maps to a standard then function, as it appears on the
   * promise.
   *
   * @param {Function} onResolve
   * @param {Function} onReject
   * @returns {Promise}
   */
  then: function(onResolve, onReject) {
    return this.realPromise.then(onResolve, onReject);
  },

  /**
   * The catch function maps to a standard then function, as it appears on the
   * promise.
   *
   * @param {Function} onReject
   * @returns {Promise}
   */
  catch: function(onReject) {
    return this.realPromise.catch(onReject);
  },

  /**
   * The follow function will wait for this promise to resolve, assume the
   * resolved value is a Restl resource and then call 'follow' on it.
   *
   * The function returns a Promise that will resolve into the result of that
   * 'follow' function.
   *
   * In practice this means you can chain multiple 'follow' calls.
   */
  follow: function(rel) {
    return this.realPromise.then(function(resource) {
      return resource.follow(rel);
    });
  },

  /**
   * The followAll function will wait for this promise to resolve, assume the
   * resolved value is a Restl resource and then call 'followAll' on it.
   *
   * The function returns a Promise that will resolve into the result of that
   * 'followAll' function.
   *
   * In practice this means you can end a chain of 'follow' calls in the
   * 'followAll' call.
   *
   * It's really the same idea as the follow function, except that you can't
   * keep on chaining after the followAll, because it resolves in an array of
   * resources.
   */
  followAll: function(rel) {
    return this.realPromise.then(function(resource) {
      return resource.followAll(rel);
    });
  }

};

module.exports = FollowablePromise;
