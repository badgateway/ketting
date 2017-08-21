'use strict';

var url = require('url');
var FollowablePromise = require('./followable-promise');
var fetch = require('./fetch');
var problemFactory = require('./http-error');
var LinkHeader = require('http-link-header');
var Link = require('./link');

var Resource = function(client, uri) {

  this.client = client;
  this.uri = uri;
  this.rep = null;

};

Resource.prototype = {

  /**
   * Fetches the resource representation.
   * Returns a promise that resolves to a parsed json object.
   *
   * @async
   * @return {string|object}
   */
  get: function() {

    return this.representation().then(function(r) {
      return r.body;
    });

  },

  /**
   * Updates the resource representation with a new JSON object.
   *
   * @async
   * @param {object} body
   * @return {void}
   */
  put: function(body) {

    return this.fetchAndThrow(
      {
        method: 'PUT',
        body: JSON.stringify(body)
      }
    ).then(function() {

      // Wipe out the local cache
      this.repr = null;
      return null;

    }.bind(this));

  },

  /**
   * Updates the resource representation with a new JSON object.
   *
   * @async
   * @return {void}
   */
  delete: function() {

    return this.fetchAndThrow(
      {
        method: 'DELETE',
      }
    ).then(function() {

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
   *
   * @async
   * @param {object} body
   * @return {null|Resource}
   */
  post: function(body) {

    return this.fetchAndThrow(
      {
        method: 'POST',
        body: JSON.stringify(body)
      }
    ).then(function(response) {

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
   *
   * This function will return the a parsed JSON object, like the get
   * function does.
   *
   * @async
   * @return {object}
   */
  refresh: function() {

    var response;
    return this.fetchAndThrow({method: 'GET'})
      .then(function(r) {
        response = r;
        return response.text();
      }).then(function(body) {
        var contentType = response.headers.get('Content-Type');
        this.repr = new (this.client.getRepresentor(contentType))(
          this.uri,
          contentType,
          body
        );

        // Extracting HTTP Link header.
        var httpLinkHeader = response.headers.get('Link');
        if (httpLinkHeader) LinkHeader.parse(httpLinkHeader).refs
          .forEach( function(httpLink) {
            // Looping through individual links
            httpLink.rel.split(' ').forEach(function(rel) {
              // Looping through space separated rel values.
              this.repr.links.push(
                new Link({
                  rel: rel,
                  baseHref: this.uri,
                  href: httpLink.uri
                })
              );
            }.bind(this));
          }.bind(this));

        // Parsing and storing embedded uris
        for (var uri in this.repr.embedded) {
          var subResource = this.client.getResource(uri);
          subResource.repr = new (this.client.getRepresentor(contentType))(
            uri,
            contentType,
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
   *
   * @async
   * @param {string} rel
   * @returns {Link[]}
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
    var request = new fetch.Request(input, init);

    return this.client.fetch(request);

  },

  /**
   * Does a HTTP request and throws an exception if the server emitted
   * a HTTP error.
   */
  fetchAndThrow: function(input, init) {

    return this.fetch(input, init).then(function(response) {

      if (response.ok) {
        return response;
      } else {
        return problemFactory(response).then(function(error) {
          throw error;
        });
      }

    });

  }

};

module.exports = Resource;
