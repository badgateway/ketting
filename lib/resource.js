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
  get : function() { 

    return this.representation().then(function(r) {
      return r.body;
    });

  },

  /**
   * Refreshes the representation for this resource.
   * Returns an empty Promise.
   */
  refresh: function() {

    return this.client.request.get(this.uri)
      .then(function(response) {

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

    return this.links().then(function(links) {

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

  }

};

module.exports = Resource;
