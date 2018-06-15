'use strict';

var url = require('./utils/url');
var FollowablePromise = require('./followable-promise');
var fetch = require('cross-fetch');
var problemFactory = require('./http-error');
var LinkHeader = require('http-link-header');
var Link = require('./link');
var mergeHeaders = require('./utils/fetch-helper').mergeHeaders;

/**
 * A 'resource' represents an endpoint on the server.
 *
 * The endpoint has a uri, you might for example be able to GET its
 * presentation.
 *
 * A resource may also have a list of links on them, pointing to other
 * resources.
 *
 * @param {Client} client
 * @param {string} uri
 * @constructor
 */
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
   * @param {string} rel - Relationship type
   * @param {Object} variables - Only needed for templated uris.
   * @returns {FollowablePromise}
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
   *
   * @async
   * @param {string} rel - Relationship type
   * @returns {Resource[]}
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
   * If it wasn't fetched yet, this function does the fetch as well.
   *
   * Usually you will want to use the `get()` method instead, unless you need
   * the full object.
   *
   * @async
   * @returns {Representation}
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
   *
   * The method signature is the same as the MDN fetch object. However, it's
   * possible in this case to not specify a URI or specify a relative URI.
   *
   * When doing the actual request, any relative uri will be resolved to the
   * uri of the current resource.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Request/Request
   * @param {Request|uri|object} input
   * @param {Object} init
   * @returns {Response}
   */
  fetch: function(input, init) {

    var uri = null;
    var newInit = {};

    if (input === undefined) {
      // Nothing was provided, we're operating on the resource uri.
      uri = this.uri;
    } else if (typeof input === 'string') {
      // If it's a string, it might be relative uri so we're resolving it
      // first.
      uri = url.resolve(this.uri, input);

    } else if (input instanceof fetch.Request) {
      // We were passed a request object. We need to extract all its
      // information into the init object.
      uri = url.resolve(this.uri, input.url);

      newInit.method = input.method;
      newInit.headers = new fetch.Headers(input.headers);
      newInit.body = input.body;
      newInit.mode = input.mode;
      newInit.credentials = input.credentials;
      newInit.cache = input.cache;
      newInit.redirect = input.redirect;
      newInit.referrer = input.referrer;
      newInit.integrity = input.integrity;

    } else if (input instanceof Object) {
      // if it was a regular 'object', but not a Request, we're assuming the
      // method was called with the init object as it's first parameter. This
      // is not allowed in the default Fetch API, but we do allow it because
      // in the resource, specifying the uri is optional.
      uri = this.uri;
      newInit = input;
    } else {
      throw new TypeError('When specified, input must be a string, Request object or a key-value object');
    }

    // if the 'init' argument is specified, we're using it to override things
    // in newInit.
    if (init) {
      for(var key in init) {
        if (key==='headers') {
          // special case.
          continue;
        }
        newInit[key] = init[key];
      }
      newInit.headers = mergeHeaders([
        newInit.headers,
        init.headers
      ]);
    }

    var request = new fetch.Request(uri, newInit);

    return this.client.fetch(request);

  },

  /**
   * Does a HTTP request and throws an exception if the server emitted
   * a HTTP error.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Request/Request
   * @param {Request|uri|object} input
   * @param {Object} init
   * @returns {Response}
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
