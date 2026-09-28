API reference
=============

This page lists the public API exported by `ketting`. The type declarations
shipped in the package, and the source in [`src/`](../src), carry the
complete signatures and doc comments.

Client
------

`new Client(bookmarkUri)`, also exported as `Ketting` and as the default
export.

| Member | Description |
| --- | --- |
| `bookmarkUri` | The URI relative URIs are resolved against. Usually the API's home document. |
| `go(uri?)` | Returns the `Resource` for a URI or a `Link`, or the bookmark resource. No request. |
| `follow(rel, variables?)` | Same as `go().follow(rel, variables)`. |
| `mayFollow(rel, variables?)` | Resolves to the resource linked from the bookmark, or `undefined` if there is no such link. |
| `use(middleware, origin?)` | Adds a [fetch middleware](middlewares.md), optionally for an origin pattern. |
| `cache` | The `StateCache`. See [Caching and events](caching.md#cache-strategies). |
| `clearCache()` | Empties the state cache. |
| `contentTypeMap` | Supported content types. See [below](#content-types). |
| `fetcher` | The `Fetcher` running the middlewares. `fetcher.advertiseKetting` toggles the `User-Agent` header. |

Resource
--------

Obtained from `client.go()`, `follow()` and similar. There is one `Resource`
per URI.

| Member | Description |
| --- | --- |
| `uri` | Absolute URI. |
| `client` | The `Client`. |
| `get(options?)` | Resolves to the `State`, from the cache or with a `GET`. |
| `refresh(options?)` | `GET` that bypasses the cache. |
| `head(options?)` | Resolves to a `HeadState`, or the cached `State`. |
| `put(options \| state)` | `PUT` request. With a `State`, it becomes the cached state. |
| `post(options)` | `POST` request, resolves to the response `State`. |
| `postFollow(options)` | `POST` request, resolves to the created `Resource`. |
| `patch(options)` | `PATCH` request, resolves to the response `State` on `200`, else `undefined`. |
| `delete()` | `DELETE` request. |
| `follow(rel, variables?)` | Resolves to the linked `Resource`. Returns a chainable `FollowPromiseOne`. |
| `followAll(rel)` | Resolves to all linked resources. Returns a chainable `FollowPromiseMany`. |
| `go(uri)` | Resource for a URI relative to this one, or for a `Link`. |
| `fetch(init?)` | `fetch()` on this URI, through the middlewares. |
| `fetchOrThrow(init?)` | Same, but throws an `HttpError` on `4xx` and `5xx`. |
| `getCache()` | The cached `State`, or `null`. |
| `updateCache(state)` | Stores a state in the cache and emits `update`. |
| `clearCache()` | Expires the cached state and emits `stale`. |
| `on()`, `once()`, `off()` | Subscribe to `update`, `stale` and `delete`. See [events](caching.md#events). |
| `link(rel)`, `links(rel?)`, `hasLink(rel)` | Deprecated. Use `(await resource.get()).links` instead. |

Request options passed to `put()`, `post()`, `postFollow()` and `patch()`:

| Option | Description |
| --- | --- |
| `data` | The body. JSON-encoded unless it is a `string`, `Uint8Array` or `Blob`. |
| `serializeBody()` | Returns the body, instead of `data`. |
| `headers` | Request headers, as an object or `Headers`. |
| `getContentHeaders()` | Returns the headers, instead of `headers`. |

`get()`, `refresh()` and `head()` accept `headers` and `getContentHeaders()`.
`Content-Type` defaults to `application/json`.

FollowPromiseOne and FollowPromiseMany
--------------------------------------

Returned by `follow()` and `followAll()`. They can be awaited like a promise,
and have:

| Member | Description |
| --- | --- |
| `follow(rel, variables?)` | Follows another link from the result (`FollowPromiseOne` only). |
| `followAll(rel)` | Follows all links from the result (`FollowPromiseOne` only). |
| `get(options?)` | Resolves to the state, or to an array of states. |
| `preFetch()` | Starts fetching the result in the background. |
| `preferTransclude()` | Sends `Prefer: transclude=<rel>`. |
| `useHead()` | Finds the links with a `HEAD` request. |

State
-----

Returned by `get()`, `refresh()`, `post()` and action submissions.

| Member | Description |
| --- | --- |
| `uri` | Absolute URI. |
| `data` | The parsed body. |
| `headers` | All response headers. |
| `links` | A `Links` object. |
| `client` | The `Client`. |
| `timestamp` | Creation time, in milliseconds. |
| `follow(rel, variables?)` | The linked `Resource`. Throws `LinkNotFound`. |
| `mayFollow(rel, variables?)` | The linked `Resource`, or `undefined`. |
| `followAll(rel)` | All linked resources, as a `Resources` array. |
| `action(name?)` | An `Action`. Throws `ActionNotFound`. |
| `findAction(name?)` | An `Action`, or `undefined`. |
| `actions()` | All actions. |
| `hasAction(name?)` | Whether the action, or any action, exists. |
| `contentHeaders()` | The headers that describe the content. |
| `serializeBody()` | The body to send back in a request. |
| `getEmbedded()` | Embedded states. |
| `clone()` | A copy. |

`HeadState`, returned by `head()`, has `uri`, `headers`, `links`,
`timestamp`, the follow methods and `contentHeaders()`.

`Resources` is an array of `Resource` with a `get(options?)` method that
fetches all states in parallel.

`BaseState`, `BaseHeadState`, `HalState`, `SirenState` and `CjState` are the
implementations, and `isState(value)` tells whether a value is a `State`.

Links
-----

A `Link` has `rel`, `href` and `context` (the URI it is relative to), and
optionally `title`, `type`, `anchor`, `hreflang`, `media`, `templated`,
`hints` and `name`.

`state.links` is a `Links` object:

| Method | Description |
| --- | --- |
| `get(rel)` | The first link with this relation, or `undefined`. |
| `getMany(rel)` | All links with this relation. |
| `getAll()` | All links. |
| `has(rel)` | Whether a link with this relation exists. |
| `add(...links)` / `add(rel, href)` | Adds links. |
| `set(link)` / `set(rel, href)` | Replaces all links with this relation. |
| `delete(rel, href?)` | Removes all links with this relation, or only the one with this `href`. |

`LinkVariables` is the type of URI template variables. `LinkNotFound` is the
error thrown when a link is missing.

Actions
-------

An `Action` has `uri`, `name`, `title`, `method`, `contentType` and `fields`,
and:

| Method | Description |
| --- | --- |
| `submit(formData)` | Submits the form, resolves to the response `State`. |
| `submitFollow(formData)` | Submits the form, resolves to the created `Resource`. |
| `field(name)` | A field, or `undefined`. |

See [Actions and forms](actions.md) for the `Field` types.

Middlewares and authentication
------------------------------

| Export | Description |
| --- | --- |
| `FetchMiddleware` | `(request, next) => Promise<Response>`. See [Fetch middlewares](middlewares.md). |
| `basicAuth(userName, password)` | HTTP Basic middleware. |
| `bearerAuth(token)` | Bearer token middleware. |
| `oauth2(options, token?)` | Deprecated OAuth2 middleware. See [Authentication](authentication.md#oauth2). |

Errors
------

| Export | Description |
| --- | --- |
| `HttpError` | Thrown on `4xx` and `5xx` responses. Has `status` and `response`. |
| `Problem` | An `HttpError` for `application/problem+json` responses. Has `body`. |
| `LinkNotFound` | Thrown by `follow()` when a link is missing. |

See [Error handling](errors.md).

Caches
------

`StateCache` is the cache interface, implemented by `ForeverCache`,
`ShortCache` and `NeverCache`. See
[Caching and events](caching.md#cache-strategies).

Utilities
---------

| Export | Description |
| --- | --- |
| `resolve(base, relative)` / `resolve(link)` | Resolves a relative URI. |
| `expand(link, variables)` / `expand(context, template, variables)` | Expands a URI template and resolves it. |

Content types
-------------

`client.contentTypeMap` maps each content type to the factory that parses it
and to its `q` value in the `Accept` header:

| Content type | Parsed as | `q` |
| --- | --- | --- |
| `application/prs.hal-forms+json` | HAL | 1.0 |
| `application/hal+json` | HAL | 0.9 |
| `application/vnd.api+json` | JSON:API | 0.8 |
| `application/vnd.siren+json` | Siren | 0.8 |
| `application/vnd.collection+json` | Collection+JSON | 0.8 |
| `application/json` | HAL | 0.7 |
| `text/html` | HTML | 0.6 |

Other content types are handled as follows:

* other `application/*+json` types are parsed as HAL;
* other `text/*` types become a `string`;
* anything else, and `204` responses, become a `Blob`.

To change the `Accept` header, change the `q` values or remove entries from
the map. Removing an entry only removes it from `Accept`: responses of that
type are then handled by the rules above.
