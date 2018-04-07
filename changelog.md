ChangeLog
=========

1.1.0 (2018-04-07)
------------------

* #70: Moved all source from `lib/` to `src/`. This is prepping for typescript
  support.
* #73: Mocha tests can now be ran in a browser.
* #76: Fixed a browser bug: Headers is not a constructor.


1.0.0 (2018-03-25)
------------------

* #66: Support for Accept header weighing with the q= parameter.
* #68: Updated all dependencies to their latest version.


0.10.3 (2018-01-31)
-------------------

* #63: It was not possible to expand templated links with variables after more
  than one chained hop. (@mhum).


0.10.2 (2018-01-31)
-------------------

* #62: It was not possible to override headers such as `Content-Type` when
  calling `Resource.fetch()`, if these were also set in the `fetchInit`
  defaults. (@mhum).


0.10.1 (2018-01-31)
-------------------

* #60: Chaining more than 2 `follow` statements did not work.


0.10.0 (2017-11-16)
-------------------

* #19: Support for OAuth2 access and refresh tokens. When used, the library
  can automatically refresh the access token if the previous one expired. It
  can also supports the `client_credentials` OAuth2 grant (@mhum).


0.9.0 (2017-09-23)
------------------

* #52: Now using the new URL object in browsers for resolving relative urls,
  and falling back to a DOM based url resolving mechanism if it's not
  available. This causes the browser distribution to drop another 10KB to
  46KB.
* Moved a bunch of utility objects into a `util/` directory, so it's more
  clear what the important API's are.
* #55: Fixed another problem related to the fetchInit function in firefox.


0.8.3 (2017-09-10)
-----------------

* Including the sourcemap file in the NPM distribution.


0.8.2 (2017-09-10)
-----------------

* #53: Regression related to the new 'fetchInit' option.
* Now generating source maps.


0.8.1 (2017-09-04)
------------------

* #50: Allow Fetch settings to be passed to the constructor of Ketting, so that
  settings such as `credentials: include` may be passed.


0.8.0 (2017-08-28)
------------------

* #49: Removed support for expanding CURIEs in HAL. This was in conflict with
  the HAL standard. The canonical relation type is the prefix in the REL, not
  the expanded CURIE uri.


0.7.1 (2017-08-24)
------------------

* Lots of documentation updates.
* Including web distribution in NPM package.


0.7.0 (2017-08-21)
------------------

* This library is now called Ketting. It used to be called Restl. Ketting is
  the dutch word for chain.
* Automatically expanding Curies in the HAL `_link` object.


0.6.0 (2017-08-20)
------------------

* #15: Browser support via webpack!
* #45: Removed Bluebird dependency.
* #16: Parsing the HTTP `Link` header (RFC5988).
* #30: Added support for automatically parsing `application/problem+json` error
  responses and throwing better exceptions. (RFC7807).
* #47: Link object now uses an object as its only constructor argument.


0.5.0 (2017-08-08)
------------------

* #41: Support for parsing HTML5. The library can now extract `link` and `a`
  elements with `rel` attributes.
* Removed the `accept` option. This should now be controlled with the
  `contentTypes` property.
* #40: Removed support for the Requests library. This library now only used
  the Fetch API, to make it compatible with browsers in the future.


0.4.2 (2017-08-03)
------------------

* #39: Making it easier to fire off custom HTTP requests on a resource using
  the Fetch API. You can now just provide the `init` argument without providing
  a url.


0.4.1 (2017-07-07)
------------------

* #38: Add HTTP response to HTTP-related exceptions.


0.4.0 (2017-07-07)
------------------

* #37: Support for templated uris.


0.3.2 (2017-04-27)
------------------

* #33: Support for OAuth2 Bearer token.


0.3.1 (2017-04-26)
------------------

* #31: Support for setting a standard `Content-Type` HTTP header.


0.3.0 (2017-04-24)
------------------

* #28: Support for Basic Authentication


0.2.1 (2017-04-21)
------------------

* #27: Fixed exception messages, they missed the HTTP status code.


0.2.0 (2017-04-21)
------------------

* #17: Now using the Fetch API instead of the requests library. The requests
  library is kept around for BC purposes, but this will eventually be removed.
* #25: the resourceCache was accidentally shared between Client instances.


0.1.2 (2017-04-19)
------------------

* #11: Added test framework.
* #11: Added `follow()` function on Client object for an easy shortcut.


0.1.1 (2017-04-03)
------------------

* #10: Returning the response body from the `refresh()` function, similar to
  `GET` but cache-defeating.


0.1.0 (2017-02-13)
------------------

* #7: Strip `_embedded` and `_links` from `Representation.body`. They are
  already available through `Representation.embedded` and
  `Representation.links`.
* Added a cache for resources in the Client object, which ensures that if you
  request the same resource twice, you'll end up with the same object.
* #6: Automatically parse `_embedded` and treat items in this object as real
  resources.
* Fixed a bug in `post()`.
* Allowing custom headers to be set, and allowing default headers to be
  overridden.
* Automatically resolve all urls from `links()`.


0.0.4 (2017-02-06)
-----------------

* Bugfixes.
* Linting with eslint.


0.0.3 (2017-02-06)
------------------

* Now using Bluebird for promises, so we can extend them.
* #2: Custom requests are now possible on `Resource` objects.
* #3: Promises returned from `follow()` now have a `follow()` function
  themselves, making it extremely easy to hop from link to link.
* Added a `post()` method for making new resources. This function returns a
  `Resource` object again if the response contained a `Location` header.
* #4: Things in the `_embedded` property are now also treated as links and can
  be followed.
* The `links()` method on Resource now have a `rel` argument for easy filtering.
* Added a `followAll()` function for getting collections.


0.0.2 (2017-01-03)
------------------

* `PUT` request.
* `DELETE` request.


0.0.1 (2016-12-28)
------------------

* First version!
* Parses HAL `_links`.
* Follows links.
* `GET` requests.
* `refresh()` function.
