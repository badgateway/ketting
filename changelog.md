ChangeLog
=========

8.0.0-alpha.4 (????-??-??)
--------------------------

* Ketting now requires Node 18.
* We're no longer building a minified browser build with Webpack. It's not
  known how many people took advantage of this feature. Please let us know if
  this was important to you, so we can add this back with a more modern stack.
* Removed mocha from the test suite, and now using the Node.js test runner.
  Mocha is painful to use with a modern Node / Typescript stack.
* Updated to hal-types 2, which updates to the latest link-hints draft, and is
  a bit looser with what it requires from a HAL document.


8.0.0-alpha.3 (2023-06-11)
--------------------------

* #476: When `cache: no-store` is specified on `fetch()` functions, Ketting
  will now no longer store responses with a `Content-Location` in its internal
  cache.
* #477: When storing responses with `Content-Location`, bodies are now cloned
  before storing so callees can still read the date.
* Testing Node 20.


8.0.0-alpha.2 (2023-04-11)
--------------------------

* Added HAL 'name' property to links.
* Updates for changes in Typescript strictness.


8.0.0-alpha.1 (2023-03-16)
--------------------------

* Ketting requires Node 16 now.
* No longer using `node-fetch`, as `fetch()` is natively supported on Node 18.
  If you are using Ketting with Node 16, you should install `node-fetch` or run
  node with the `--experimental-fetch` option.
* Upgraded OAuth2 dependency to [@badgateway/oauth2-client][8].
* Submitting actions with missing required fields will now throw an exception.
* Actions that have pre-filled values will auto submit those values unless they
  are explicitly overridden.
* #459: Now uses the correct spelling of 'placeholder' in HAL forms (@dayre).
* Export the `FetchMiddleware` type.
* #444: Allow multiple query parameters to be set with the same key when
  specifying template variables. (@qmachard)
* Upgrade to Typescript 5


7.5.2 (2024-09-19)
------------------

* Updating dependencies.


7.5.1 (2022-09-03)
------------------

* Typescript 4.8 support!


7.5.0 (2022-08-26)
------------------

* #401: The mechanism that de-duplicates identical requests is now a bit
  smarter, and will not de-duplicate requests that are significantly different
  such as a different `Accept` header. (@hugothomas @reda-alaoui)
* #450: `value` field for some HAL inputs were ignored (color, checkbox,
  radio).


7.4.2 (2022-05-11)
------------------

* Added support for `minLength` and `maxLength` attributes on textarea fields
  in HAL Forms. (@dayre).


7.4.1 (2022-03-21)
------------------

Idential to the last beta. Contains the following features that were introduced
in the previous betas:

* #433: Fixed race condition when processing nested `_embedded` resources and
  emiting `update` events. The order at which they happen is now consistent.
  When the `update` event happens, the entire cache should be up to date.
* #328: `Resource.go()` and `Client.go()` can now take a `Link` object as the
  argument.


7.4.1-beta.1 (2022-03-20)
-------------------------

* Fixed a bug that was introduced with #433.


7.4.1-beta.0 (2022-03-20)
-------------------------

* #433: Fixed race condition when processing nested `_embedded` resources and
  emiting `update` events. The order at which they happen is now consistent.
  When the `update` event happens, the entire cache should be up to date.
* #328: `Resource.go()` and `Client.go()` can now take a `Link` object as the
  argument.


7.4.0 (2022-03-17)
------------------

* #426: Setting up cache dependencies through `inv-by` links is now possible
  via HAL `_links` and in embedded resources, as well as links from all the
  other formats.
* #425: Fewer warnings related to 'Max listeners exceeded'. The default of 10
  is too low for typical Ketting applications.


7.3.0 (2022-01-06)
------------------

* #416: Cache-dependencies setup with `inv-by` links are now respected when
  manually clearing resource caches.
* #414: Don't attempt to parse the response if it had a `204` status, even if
  there was a `Content-Type` header.
* #408: Emit a warning when an `_embedded` HAL item is missing a good `self`
  link.


7.2.0 (2021-08-04)
------------------

* #395: Relative URIs in embedded HAL documents are now resolved using the
  'self' link in the embedded document, instead of the parent. Although not
  explicitly said in the HAL standards, I feel this is the right behavior. Most
  users will not see a difference, but if you relied on the old behavior this
  could cause some subtle BC breaks.


7.1.1 (2021-06-15)
------------------

* #392: The `action()` function on State classes would only return the default
  action (@reda-alaoui).
* Changed how Cache classes are exported, as an experiment to see if IDE docs
  are more complete.


7.1.0 (2021-05-27)
------------------

* Support for the `inv-by` Link relationship type from the [Linked Cache
  Invalidation draft][2]. This link lets a resource tell the client that it's
  cache should expire when the linked resource's cache also expires.
* The 'prompt' field in HAL Forms for properties with 'options' set was
  ignored.


7.0.1 (2021-05-04)
------------------

* No longer testing Node 10 and Node 15. Added Node 16.
* Actions are now retained when caching. Before this, action information was
  dropped which meant that any actions in embedded resources were not
  accessible. (@hugothomas)


7.0.0 (2021-04-11)
------------------

* New major version! See Github for a list of changes.
* `Title` header is now defined as a HTTP Entity Header.


7.0.0-beta.5 (2021-03-08)
-------------------------

* `label` and `value` were parsed in reverse.


7.0.0-beta.4 (2021-02-26)
-------------------------

* Added renderAs 'checkbox' to multi-select fields in actions.
* Export `OptionDataSource`.


7.0.0-beta.3 (2021-02-21)
-------------------------

* Support for HAL Forms version `2021-02-20`, which adds the 'options'
  property.
* Kettings now has support for 'dropdown' fields, allowing users to provide
  lists of possible options in 3 different ways: 1. An inline list 2. An
  external HTTP resource (JSON body or CSV body) 3. Provided as links from a
  hypermedia source. Only 1 and 2 are supported by HAL Forms, 3 is just an
  internal feature until there is a format that has first-class support for
  this.
* A bit of a rewrite of 'fields' again. Only a single type is exported, and all
  the types are cleaned up.


7.0.0-beta.2 (2021-01-25)
-------------------------

* Support for Siren 'title' on fields. This was an oversight.


7.0.0-beta.1 (2021-01-25)
-------------------------

* Remove support for `Prefer-Push`. Browsers are basically dropping HTTP/2
  Push, and not enough work is done to make this very interesting. [More
  background](https://evertpot.com/http-2-push-is-dead/).
* Revert 'unifiying URLs' PR, we're back to using `url.resolve` in node.


7.0.0-beta.0 (2021-01-19)
-------------------------

* Note: this release has a number of BC breaks, which will only affect you if
  you wrote custom format parsers. See the wiki for more details.
* #326: State objects now have `follow()` and `followAll()` methods.
* #322: Add `type`, `status`, `detail`, `instance` properties to `Problem`
  class, for better support of [`application/problem+json`][6]. (@sazzer).
* #327: If a response is received with a `Content-Location` header, the
  response will now immediately get stored in the cache.
* Support for [`draft-dalal-deprecation-header`][7]. Ketting will now emit
  warnings if a `Deprecation` header is detected, and will also provide
  information from the `Sunset` header and include the uri of the `deprecation`
  link relation.
* Support for the latest [HAL-Forms][5] features, including `target`, `step`,
  `min`, `max`, `type`, `minLength`, `maxLength`, `placeholder`, `cols`,
  `rows`.
* Support multiple HAL Forms, as per the latest spec updates. Before only a
  'default' form was supported.
* Add `textarea` form field type.
* #324: Only use `{cache: 'no-cache'}` with `.refresh()`, not `.get()`.
* Fixed a subtle URL resolving bug in browsers. (Node was not affected).


6.2.0 (2020-12-01)
------------------

* Updated `fetch-mw-oauth2`, which has a few new features: * Fixed a race
  condition where two 401's in quick succession could result in two OAuth2
  refresh requests, ultimately causing 1 to fail. * Preemptively refresh if we
  know when the access token will expire.


6.1.4 (2020-11-30)
------------------

* #302: Templated links without template data don't work.


6.1.3 (2020-11-19)
------------------

* Add a `getCache()` function to Resource, which allows a user to get the
  latest Resource State in a synchronous manner.
* #292: Parse Siren's 'value' property in action fields.
* `fetch-mw-oauth2` dependency had a bug related to refreshing tokens. This
  release ships with a version without that bug.


6.1.2 (2020-11-09)
------------------

* Update the `fetch-mw-oauth2` dependency, which adds an `onAuthError` event.


6.1.1 (2020-11-05)
------------------

* `state.links.delete()` can now take a `href` argument to delete a specific
  link from its list.
* Improvements in error messaging.
* Upgrade to Webpack 5


6.1.0 (2020-10-04)
------------------

* Large changes in the actions/form system. This should still be considered
  experimental and could cause some minor BC breaks.
* Actions are now effectively a serialization of a HTML form, and it's now
  possible to introspect information such as the `target`, `method`,
  `contentType`, etc.
* Some refactoring in the `State` objects, simplifiying these significantly.


6.0.4 (2020-10-04)
------------------

* State objects now have an `actions()` method that return all defined actions.


6.0.3 (2020-09-30)
------------------

* #241: Add `application/prs.hal-forms+json` to Accept header and treat as HAL
  (@reda-alaoui).
* #260: `action()` could not be successfully called on a HAL action.
  (@reda-alaoui).
* Add `action()` function to `State` interface.


6.0.2 (2020-09-28)
------------------

* #248: Parse JSON objects that have an array at the top-level.
* #257: `ETag` and `Last-Modified` are now treated as 'Content headers', which
  means they will get returned from `getContentHeaders()`.


6.0.1 (2020-09-09)
------------------

* Quick re-release. Some files were left in the `dist/` directory that were not
  cleaned up.


6.0.0 (2020-09-09)
------------------

* New major release!
* Added support for [Siren][1] action fields.
* Added support for [HAL Forms][4].


6.0.0-beta.2 (2020-08-15)
-------------------------

* Support `draft-nottingham-link-hint` on Links.
* Added: `client.fetcher.advertiseKetting`. Setting this to false will cause
  Ketting to *not* set the `User-Agent` header.
* `Resource.patch()` will now return a `State `object if the server responded
  with `200 OK` and a body.


6.0.0-beta.1 (2020-08-10)
-------------------------

* #229: Embedded resources were not cached. (@madsmadsen)
* #230: Respect `headers` property in options of `refresh()` function.
  (@madsmadsen)
* Lots of Ketting 6 doc updates.
* JSDocs everywhere gotten a fresh proof read.


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
* When calling `put()` with a new `State` object, that object will now be
  placed in cache.
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
* `Ketting` class is now called `Client`. It's still exposed as `Ketting` as
  well for BC purposes.
* `Client.getResource()` has been removed. Use `Client.go()` instead.
* A HTTP Fetch middleware system has been added, for easier manipulation of
  requests and responses. Middlewares can be added for every request, or for
  specific origins (domains).
* All authentication settings have been removed, and reimplemented as fetch
  middlewares. They take roughly the same options, but the setup has changed.
* `Resource.get()`, `Resource.put()`, etc. can now all take custom headers and
  other options to manipulate the request.
* In the past you could just send a body with `Resource.post()`, `.put()`,
  .`patch()`. Now this body must be a wrapped in an object with at least a
  `.body` property. This is an annoying BC break but will allow for more
  flexibility that was previous impossible.
* Proper support for 'binary' resources.
* Hal Links will now be reserialized on `put()`.
* `Resource.link`, `Resource.links` and `Resource.hasLink` has been deprecated,
  but not removed.
* `Link` objects are now a simple typescript type, and no longer implemented as
  a class.
* `FollowerOne` is now `FollowPromiseOne` and `FollowerMany` is now
  `FollowPromiseMany`.
* All things called `Representor` has been removed, and rewritten with a
  completely new API. A `HAL representor` is now a `HalState`.
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

* Correct return type on followAll, so it may be chained with preFetch. This
  was only an issue when doing 'multiple hops'.


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
  Ketting will automatically clear the cache of any related resources. See
  [draft-nottingham-linked-cache-inv-04][2].


5.0.0-alpha.0 (2019-10-18)
--------------------------

* Support for the [Siren][1] format.
* Rewrite of the 'representation' system, which is responsible for supporting
  all the different media types. This results in a few small BC breaks.
* NEW: `follow()` and `followAll()` now throw `LinkNotFound` instead of the
  generic `Error` when a link could not be found.
* NEW: Resources now have a `link(rel: string)` function, which returns a a
  single `Link` object.
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
* #129: Fixed the browser distribution. the `Ketting` constructor is registered
  globally again.


4.0.0-alpha.0 (2019-04-22)
--------------------------

* The old format for OAuth2 setup is now no longer supported.
* It's now possible to specify per-domain authentication using wildcards. This
  allows you to set up specific authentication credentials for specific
  domains. This might be useful in case you talk to multiple API's with a
  single client.


3.1.0 (2019-03-28)
------------------

* If Ketting anticipates that a user might want to fetch multiple resources in
  sequence (a follow chain), it will now add `Prefer-Push` header and a
  `Prefer: transclude` header. Both are experimental internet drafts to suggest
  to a server to do a HTTP/2 push or embed a child resource respecitvely. This
  feature is experimental and might change as these drafts change.


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

* The `Resource` class is now a generic typescript type. This allows a user of
  the library to define specific 'types of resources' and leverage static
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

* Refreshing OAuth2 tokens without having a refresh_token. `client_credentials`
  in particular shouldn't return a `refresh_token`, so for these cases, new
  access tokens are acquired using a new `client_credentials` request.


2.2.0 (2018-09-18)
------------------

* Support for OAuth2 `client_credentials` grant.


2.1.0 (2018-09-14)
------------------

* No longer ships with `cross-fetch` and `whatwg-fetch`. To use this library in
  a browser, you must run this in a browser that supports `fetch` or provide
  your own polyfill.
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
* #80: `resource.fetch()` would throw an exception with some combinations of
  arguments.
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

* #19: Support for OAuth2 access and refresh tokens. When used, the library can
  automatically refresh the access token if the previous one expired. It can
  also supports the `client_credentials` OAuth2 grant (@mhum).


0.9.0 (2017-09-23)
------------------

* #52: Now using the new URL object in browsers for resolving relative urls,
  and falling back to a DOM based url resolving mechanism if it's not
  available. This causes the browser distribution to drop another 10KB to 46KB.
* Moved a bunch of utility objects into a `util/` directory, so it's more clear
  what the important API's are.
* #55: Fixed another problem related to the fetchInit function in firefox.


0.8.3 (2017-09-10)
------------------

* Including the sourcemap file in the NPM distribution.


0.8.2 (2017-09-10)
------------------

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
* #40: Removed support for the Requests library. This library now only used the
  Fetch API, to make it compatible with browsers in the future.


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
------------------

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
* The `links()` method on Resource now have a `rel` argument for easy
  filtering.
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
[5]: http://rwcbook.github.io/hal-forms/
[6]: https://tools.ietf.org/html/rfc7807 "Problem Details for HTTP APIs"
[7]: https://tools.ietf.org/html/draft-dalal-deprecation-header-03 "The
     Deprecation HTTP Header Field"
[8]: https://github.com/badgateway/oauth2-client
