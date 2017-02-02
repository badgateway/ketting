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
   *
   * The rel argument is optional. If it's given, we will only return links
   * from that relationship type.
   */
  links: function(rel) {

    return this.representation().then(function(r) {
      if (!rel) return r.links;
      return r.links.filter( function(item) { return item.rel === rel; } );
    });

  },

  /**
   * Follows a relationship, based on its reltype. For example, this might be
   * 'alternate', 'item', 'edit' or a custom url-based one.
   *
   * Returns a new Resource object
   */
  follow: function(rel) {

    var result = this.links(rel).then(function(links) {

      if (links.length === 0) {
        throw new Error('Relation with type ' + rel + ' not found on resource ' + this.uri);
      }
      return new Resource(
         this.client,
         url.resolve(this.uri, links[0].href)
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

    /*
     * Similarly, we're adding a followAll
     */
    result.followAll = function(rel) {

      return result.then(function(resource) {

        return resource.followAll(rel);

      });

    };

    return result;

  },

  /**
   * Follows a relationship based on its reltype. This function returns a
   * Promise that resolves to an array of Resource objects.
   *
   * If no resources were found, the array will be empty.
   */
  followAll: function(rel) {

    return this.links(rel).then(function(links) {

      return links.map(function(link) {
        return new Resource(
          this.client,
          url.resolve(this.uri, link.href);
        });
      });
    });
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
