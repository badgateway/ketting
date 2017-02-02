"use strict";

var Representation = require('./representation');
var url = require('url');

var Resource = function(client, uri) {

  this.client = client;
  this.uri = uri;
  this.rep = null;

};

Resource.prototype = {

  /**
   * Fetches the resource representation.
   * Returns a promise that resolves to a parsed json object.
   */
  get: function() {

    return this.representation().then(function(r) {
      return r.body;
    });

  },

  /**
   * Updates the resource representation with a new JSON object.
   */
  put: function(body) {

    return this.request({
      method: 'PUT',
      uri: this.uri,
      body: body
    }).then(function(response) {
      return null;
    });

  },

  /**
   * Updates the resource representation with a new JSON object.
   */
  delete: function(body) {

    return this.request({
      method: 'DELETE',
      uri: this.uri,
      body: body
    }).then(function(response) {
      return null;
    });

  },

  /**
   * Refreshes the representation for this resource.
   * Returns an empty Promise.
   */
  refresh: function() {

    return this.request({
      method: 'GET',
      uri: this.uri
    }).then(function(response) {
       this.repr = new Representation(
         response.headers['content-type'],
         response.body
       );
    }.bind(this));

  },

  /**
   * Returns the links for this resource, as a promise.
   */
  links: function() {

    return this.representation().then(function(r) {
      return r.links;
    });

  },

  /**
   * Follows a relationship, based on its reltype. For example, this might be
   * 'alternate', 'item', 'edit' or a custom url-based one.
   *
   * Returns a new Resource object
   */
  follow: function(rel) {

    var result = this.links().then(function(links) {

      var link = links.find(function(link) {
        return link.rel === rel;
      });
      if (!link) {
        throw new Error('Relation with type ' + rel + ' not found on resource ' + this.uri);
      }
      return new Resource(
         this.client,
         url.resolve(this.uri, link.href)
      );

    }.bind(this));

    /*
     * We're adding a follow() function on the result Promise. This makes it
     * super easy to quickly follow a chain of links.
     */
    result.follow = function(rel) {

      return result.then(function(resource) {

        return resource.follow(rel);

      });

    };

    return result;

  },

  /**
   * Returns the representation for the object.
   *
   * If it wasn't fetched yet, this function does the fetch as well.
   */
  representation: function() {

    if (this.repr) {
      return Promise.resolve(this.repr);
    } else {
      return this.refresh().then(function() {
        return this.repr;
      }.bind(this));
    }

  },

  /**
   * Does an arbitrary HTTP request on the resource, and returns the HTTP
   * response object from the Request library, wrapped in a Promise.
   */
  request: function(options) {

    return this.client.request(options);

  }

};

module.exports = Resource;
