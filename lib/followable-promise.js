'use strict';

var Promise = require('bluebird/js/release/promise')();
Promise.prototype.follow = function(rel) {

  return this.then(function(resource) {
    return resource.follow(rel);
  });

};

Promise.prototype.followAll = function(rel) {

  return this.then(function(resource) {
    return resource.followAll(rel);
  });

};

module.exports = Promise;
