'use strict';

var Representation = require('./representation');
var url = require('url');
var FollowablePromise = require('./followable-promise');
var Promise = require('bluebird');
var fetch = require('node-fetch');
var HttpError = require('./http-error');

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

    return this.fetch(
      this.uri,
      {
        method: 'PUT',
        body: JSON.stringify(body)
      }
    ).then(function(response) {

      if (!response.ok) {
        throw new HttpError(response);
      }

      // Wipe out the local cache
      this.repr = null;
      return null;

    }.bind(this));

  },

  /**
   * Updates the resource representation with a new JSON object.
   */
  delete: function() {

    return this.fetch(
      this.uri,
      {
        method: 'DELETE',
      }
    ).then(function(response) {

      if (!response.ok) {
        throw new HttpError(response);
      }

      // Wipe out the local cache
      this.repr = null;
      return null;

    }.bind(this));

  },

  /**
   * Sends a POST request to the resource.
   *
   * This function assumes that POST is used to create new resources, and
   * that the response will be a 201 Created along with a Location header that
   * identifies the new resource location.
   *
   * This function returns a Promise that resolves into the newly created
   * Resource.
   *
   * If no Location header was given, it will resolve still, but with an empty
   * value.
   */
  post: function(body) {

    return this.fetch(
      this.uri,
      {
        method: 'POST',
        body: JSON.stringify(body)
      }
    ).then(function(response) {

      if (!response.ok) {
        throw new HttpError(response);
      }

      if (response.headers.has('location')) {
        return this.client.getResource(
           url.resolve(
             this.uri,
             response.headers.get('location')
           )
        );
      }
      return null;

    }.bind(this));

  },

  /**
   * Refreshes the representation for this resource.
   * Returns an empty Promise.
   */
  refresh: function() {

    var response;
    return this.fetch(this.uri, {method: 'GET' })
    .then(function(r) {
      response = r;
      if (!response.ok) {
        throw new HttpError(response);
      } else {
        return response.json();
      }
    }).then(function(jsonBody) {
      this.repr = new Representation(
        this.uri,
        response.headers['content-type'],
        jsonBody
      );
      // Parsing and storing embedded uris
      for (var uri in this.repr.embedded) {
        var subResource = this.client.getResource(uri);
        subResource.repr = new Representation(
           uri,
           response.headers['content-type'],
           this.repr.embedded[uri]
        );
      }
      return this.repr.body;
      // Removing embedded because it just takes up extra memory.
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
   * This function can also follow templated uris. You can specify uri
   * variables in the optional variables argument.
   *
   * @param {String} rel Relationship type
   * @param {Object} Variables. Only needed for templated uris.
   * @return Promise{Resource}
   */
  follow: function(rel, variables) {

    return new FollowablePromise(function(res, rej) {

      this.links(rel)
        .then(function(links) {

          var href;
          if (links.length === 0) {
            throw new Error('Relation with type ' + rel + ' not found on resource ' + this.uri);
          }
          if (links[0].templated) {
            href = links[0].expand(variables);
          } else {
            href = links[0].resolve();
          }

          var resource = this.client.getResource(
            href
          );

          res(resource);
        }.bind(this))
        .catch(function(reason) {
          rej(reason);
        });

    }.bind(this));

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
        return this.client.getResource(
          link.resolve()
        );
      }.bind(this));
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

  },

  /**
   * Does an arbitrary HTTP request on the resource using the Fetch API.
   */
  fetch: function(input, init) {

    if (typeof input === 'undefined') {
      // Nothing was provided, we're operating on the resource uri
      input = this.uri;

    } else if (typeof input === 'string') {
      // A uri as sting is provided, we're resolving it.
      input = url.resolve(this.uri, input);

    } else if (typeof input.url === 'string') {
      // A url is provided in the init object.
      input.url = url.resolve(this.uri, input.url);
    } else {
      // The provided argument is untyped, so likely the init
      // parameter was put first.

      // Using the argument as the 'init' value
      init = input;

      // And using the current uri as the 'input' value.
      input = this.uri;

    }
    console.log(input, init);
    var request = new fetch.Request(input, init);

    return this.client.fetch(request);

  },

  /**
   * Does an arbitrary HTTP request on the resource, and returns the HTTP
   * response object from the Request library, wrapped in a Promise.
   */
  request: function(options) {

    var uri = this.uri;
    if (options.uri) {
      // uri was provided in options. We shall use that uri to generate a new
      // one.
      uri = url.resolve(uri, options.uri);
    } else if (options.url) {
      // Same thing, but 'url' was used instead of uri
      uri = url.resolve(uri, options.url);
      // Cleanup
      delete options.url;
    }
    options.uri = uri;
    return this.client.request(options);

  }

};

module.exports = Resource;
