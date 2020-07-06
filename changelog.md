ChangeLog
=========

6.0.0-beta.0 (2020-07-06)
-------------------------

* Switched from tslint to eslint.
* Feature complete!


6.0.0-alpha.7 (2020-06-19)
--------------------------

* `isState()` type guard is exported.


6.0.0-alpha.6 (2020-06-16)
--------------------------

* The Links object now has a default 'context', making it easier to add
  relative links.
* Links now has an easier to use API for setting or adding new links.
* Links now has a `.delete()` method to delete by `rel`.


6.0.0-alpha.5 (2020-06-08)
--------------------------

* Added 'actions', allowing users to automatically submit actions and/or Forms
  for supported formats.
* Action support is added for `text/html` and `application/vnd.siren+json`
* Supported content-types for actions are `application/json` and
  `application/x-www-form-urlencoded`.
* `State` objects now have a reference to `Client`.
* `resolve()` function is now a package export, providing a cross-platform
  function for resolving urls.
* `Resource` has now a `updateCache` function for local state changes without
  submitting to the server.
* `refresh()` now emits an `update` event.


6.0.0-alpha.4 (2020-05-11)
--------------------------

* Fixing bugs related to `patch()`, `post()` in the browser build.


6.0.0-alpha.3 (2020-05-10)
--------------------------

* `Resources` implement EventEmitter, and can emit `stale`, `update` and
  `delete` events.
* The 'body' property on State is now 'data'
* #141: Added `head()` function and ability to follow links just through `HEAD`
  methods via the `Link` header.
* Added a `NeverCache` and `ShortCache` if automatically storing every `State`
  object until invalidation is not desired.
* When calling `put()` with a new `State` object, that object will now be placed
  in cache.
* When refreshing, `fetch()` is now given the 'reload' cache setting, so that
  `refresh()` is a true Refresh, even with a browser cache.
* #130: Support relative bookmark URIs when using Ketting in a browser.
* Siren was not correctly parsed.
* Add `.clone()` method to all `State` object.



6.0.0-alpha.2 (2020-05-03)
--------------------------

* `State` is now exported.
* #184: Added a new `postFollow()` function that takes over the role of
  `post()`.  `post()` is now intended for RPC-like operations and form
  submissions.


6.0.0-alpha.1 (2020-05-03)
--------------------------

* Re-release. The build contained a few older files that weren't meant to be
  packaged.


6.0.0-alpha.0 (2020-04-28)
--------------------------

* Big BC-breaking rewrite. Changes are numerous, but the important ones are
  listed here.
* `Resource.get()` now returns a `State` object instead of just a response
  body. This object has methods to make it easier to manipulate and get
  information about the response, including links. It's also a stable,
  non-async object.
* `Ketting` class is now called `Client`. It's still exposed as `Ketting`
  as well for BC purposes.
* `Client.getResource()` has been removed. Use `Client.go()` instead.
* A HTTP Fetch middleware system has been added, for easier manipulation of
  requests and responses. Middlewares can be added for every request, or
  for specific origins (domains).
* All authentication settings have been removed, and reimplemented as
  fetch middlewares. They take roughly the same options, but the setup
  has changed.
* `Resource.get()`, `Resource.put()`, etc. can now all take custom headers
  and other options to manipulate the request.
* In the past you could just send a body with `Resource.post()`, `.put()`,
  .`patch()`. Now this body must be a wrapped in an object with at least a `.body`
  property. This is an annoying BC break but will allow for more flexibility
  that was previous impossible.
* Proper support for 'binary' resources.
* Hal Links will now be reserialized on `put()`.
* `Resource.link`, `Resource.links` and `Resource.hasLink` has been deprecated,
  but not removed.
* `Link` objects are now a simple typescript type, and no longer implemented
  as a class.
* `FollowerOne` is now `FollowPromiseOne` and `FollowerMany` is now
  `FollowPromiseMany`.
* All things called `Representor` has been removed, and rewritten with
  a completely new API. A `HAL representor` is now a `HalState`.
* #175: Nested embedded items are now also placed in the cache.


5.2.1 (2020-03-03)
------------------

* Use the `title=` attribute from the HTTP Link header, if it exists.

5.2.0 (2020-02-17)
------------------

* Added 'finally()' to custom follower promises.
* All representors are now exported in the `representor` namespace.


5.1.2 (2020-02-12)
------------------

* Correct return type on followAll, so it may be chained with preFetch.
  This was only an issue when doing 'multiple hops'.


5.1.1 (2020-01-10)
------------------

* #173: De-duplicate HAL links if they appear in _embedded and _links.


5.1.0 (2020-01-05)
------------------

* Support for the [Collection+json][4] format.
* Added a `preferTransclude()` method on the Follower objects. This
  automatically adds a `Prefer: tranclude="rel"` header.


5.0.1 (2019-12-09)
------------------

* Update all dependencies.


5.0.0 (2019-11-22)
------------------

* This version is the exact same as the previous alpha.


5.0.0-alpha.7 (2019-11-12)
--------------------------

* Added `hasLink` on Resources and Representations.


5.0.0-alpha.6 (2019-11-06)
--------------------------

* Fixed a bug in `getOptions()`


5.0.0-alpha.5 (2019-11-06)
--------------------------

* Added a `preferPush()` method to 'Follower' objects, allowing you to
  automatically send [`Prefer-Push`][3] headers when following links.
* Moved all functionality related to the 'Repreprentor' in a utility class,
  making both the `Ketting` and `Resource` classes simpler.
* Simplified `Resource.refresh()`, making it easier to read and do less work.
* When calling `.post()`, the function will only return a new resource if the
  HTTP response code was `201`.
* If the HTTP response code to a `post()` call was `205`, it will now return
  the current resource.
* Removed the logic for automatically adding `Prefer-Push` headers. This was
  unreliable, and usually did the wrong thing. The new system is 100% opt-in
  and developer-driven.
* Added `Ketting.getOptions()` to return a list of options that were passed to
  Ketting. The options will be enhanced with OAuth2 refresh and access tokens
  as they become available, meaning that it can be used to place in
  LocalStorage to remember sessions. This feature is experimental and
  incomplete. It might change even in minor versions.


5.0.0-alpha.4 (2019-10-31)
--------------------------

* This version is identical to the last, but fixes an issue on npmjs.com.
  Updating is not needed.


5.0.0-alpha.3 (2019-10-31)
--------------------------

* It's now possible to tell Ketting to prefetch every resource when following
  links via `Resource.follow('foo').preFetch()`.
* `Link` and `LinkNotFound` are now both exported.
* Documentation overhaul.


5.0.0-alpha.2 (2019-10-21)
--------------------------

* Slight tweak to the webpack build, so that other typescript + webpack
  projects can use the webpack build and use the minified files.


5.0.0-alpha.1 (2019-10-21)
--------------------------

* Now supports the 'invalidates' link rel. When specified in a HTTP response,
  Ketting will automatically clear the cache of any related resources.
  See [draft-nottingham-linked-cache-inv-04][2].


5.0.0-alpha.0 (2019-10-18)
--------------------------

* Support for the [Siren][1] format.
* Rewrite of the 'representation' system, which is responsible for supporting
  all the different media types. This results in a few small BC breaks.
* NEW: `follow()` and `followAll()` now throw `LinkNotFound` instead of the
  generic `Error` when a link could not be found.
* NEW: Resources now have a `link(rel: string)` function, which returns a
  a single `Link` object.
* BC BREAK: `Ketting.getRepresentor()` is now `Ketting.createRepresentation()`
  and is responsible for constructing the object instead of just returning a
  constructor.
* BC Break: `body`, `links` and `embedded` on `Representor` objects are all
  gone and replaced with `getBody()`, `getLinks()` and `getEmbedded()`.
* BUG: Hal is now more lenient with broken responses.
* NEW: Compatible with Typescript's `strictNullChecks` setting. Overall
  stronger typing all around.
* NEW: Hal responses from the HAL representor are now properly typed.
* CHANGE: Link chaining system has been rewritten, opening the door to new
  features that weren't possible before.

4.0.4 (2019-10-31)
------------------

* This version is identical to the last, but fixes an issue on npmjs.com.
  Updating is not needed.


4.0.3 (2019-09-11)
------------------

* The internal resource cache will now evict items for any non-safe HTTP
  method.


4.0.2 (2019-09-05)
------------------

* Broke Typescript exports again


4.0.1 (2019-09-05)
------------------

* Fix Typescript defintion files so Ketting may be imported correctly.


4.0.0 (2019-09-04)
------------------

* #129: Using the package in non-typescript node.js now works with a simple
  `const Ketting = require('ketting')`.
* #129: Fixed the browser distribution. the `Ketting` constructor is
  registered globally again.


4.0.0-alpha.0 (2019-04-22)
--------------------------

* The old format for OAuth2 setup is now no longer supported.
* It's now possible to specify per-domain authentication using wildcards.
  This allows you to set up specific authentication credentials for specific
  domains. This might be useful in case you talk to multiple API's with a
  single client.


3.1.0 (2019-03-28)
------------------

* If Ketting anticipates that a user might want to fetch multiple resources
  in sequence (a follow chain), it will now add `Prefer-Push` header and
  a `Prefer: transclude` header. Both are experimental internet drafts to
  suggest to a server to do a HTTP/2 push or embed a child resource
  respecitvely. This feature is experimental and might change as these drafts
  change.


3.0.2 (2019-03-19)
------------------

* A mistake was made when releasing version 3. A branched was not merged in
  entirely, which caused some of the new OAuth2 features to be partially
  missing. This has now been corrected.


3.0.1 (2019-03-18)
------------------

* Updated dependencies

3.0.0 (2019-03-18)
------------------

* Switched OAuth2 implementation from `client-oauth2` to `fetch-mw-oauth2`.
  This adds support for `authorization_code` auth, removes 11 dependencies and
  reduces the minified Ketting build from 69KB to 28KB.
* OAuth2 options now have a new format. The old format is still supported, but
  will be removed from a future version.
* The `baseHref` propertyname was renamed to `Context` on the `Link` type. The
  new name matches the name from RFC8288. This is a small BC break.


2.5.1 (2019-03-01)
------------------

* #120: The system that de-duplicates identical requests will cache failures
  forever. This is now fixed. Highly recommended update.


2.5.0 (2019-01-22)
------------------

* Basic JSON:API support. Currently only links appearing in the top-level
  document are supported.
* #113: Support for Typescript environments that don't have `esModuleInterop`
  set to true.
* Added a 'go' function for easily getting resources based on relative uris.


2.4.1 (2018-11-07)
------------------

* If a link appears in both `_embedded` and `_links`, they will be
  de-duplicated. HAL technically requires links to appear in both places, so
  scanning `_embedded` should not be needed. However, most implementations will
  not add links `_links` if they were already `_embedded`. This change caters
  both usages.


2.4.0 (2018-11-05)
------------------

* The `Resource` class is now a generic typescript type. This allows a user
  of the library to define specific 'types of resources' and leverage static
 typing for `GET` and `PUT` requests.
* A few documentation updates.


2.3.0 (2018-10-10)
------------------

* Better handling of `Content-Types`. When following HAL links that have a
  `type` parameter, the type is rememebered and used in `Accept` and
  `Content-Type` headers, for `GET`, `PUT` and `POST` requests.
* If no `type` was provided, it will use the last `Content-Type` header from
  `GET` response.
* If that `GET` request never happened, it uses the first 'default'
  `Content-Type` from client.contentTypes, and enumerates all mime-types from
  that list for `Accept` headers.
* No longer incorrectly sends `text/plain` Content-Types.
* Optimization: If multiple calls are made to ask for a Resource's current
  representation, all these calls are coalesced into one. The big benefit is
  that there are no longer multiple parallel `GET` requests.
* Webpack browser build is set to 'production' mode.
* Fixed: After refreshing an OAuth2 token, the new access token wasn't used.


2.2.1 (2018-09-19)
------------------

* Refreshing OAuth2 tokens without having a refresh_token.
  `client_credentials` in particular shouldn't return a `refresh_token`, so
  for these cases, new access tokens are acquired using a new
  `client_credentials` request.


2.2.0 (2018-09-18)
------------------

* Support for OAuth2 `client_credentials` grant.


2.1.0 (2018-09-14)
------------------

* No longer ships with `cross-fetch` and `whatwg-fetch`. To use this library
  in a browser, you must run this in a browser that supports `fetch` or
  provide your own polyfill.
* Updated dependencies


2.0.4 (2018-09-12)
------------------

* Fixed bug: HAL title values weren't parsed.


2.0.3 (2018-08-23)
------------------

* Exporting 'Resource' for TS purposes.


2.0.2 (2018-08-23)
------------------

* Updated dependencies
* Fixed a typescript definition problem.


2.0.1 (2018-06-17)
------------------

* Same as last build.

2.0.0 (2018-06-17)
------------------

* #71: Total conversion to Typescript.
* BC break: Minified files are now in the `browser/` directory, not the `dist/`
  directory.
* #78: Webpack build had a broken version of `querystring`, which caused
  `Link:` header parsing to fail in browsers.
* #80: `resource.fetch()` would throw an exception with some combinations
  of arguments.
* #90: `get()` and `refresh()` will now throw an Error when a server did not
  include a content-type.
* #89: Refactored OAuth utility to be a bit more clear.
* #83: Support for `resource.patch()`. The implementation is pretty basic. Let
  us know how you would like to use it!


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

[1]: https://github.com/kevinswiber/siren
[2]: https://tools.ietf.org/html/draft-nottingham-linked-cache-inv-04
[3]: https://tools.ietf.org/html/draft-pot-prefer-push
[4]: http://amundsen.com/media-types/collection/format/
