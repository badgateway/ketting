Caching and events
==================

*This page builds on the concepts from [Getting started](getting-started.md).*

Ketting keeps the `State` of every resource it fetched in a cache, so that
`get()` does not hit the server again. This page explains when the cache is
filled, when it is expired, and how to react to changes.

What fills the cache
--------------------

* A `GET` response, from `get()` or `refresh()`.
* A `PUT` with a whole `State` object: the submitted state becomes the cached
  state once the server accepted it.
* `resource.updateCache(state)`, which stores a state without any request.
* Embedded resources, such as HAL `_embedded` items and Siren sub-entities.
  Each one is stored under its own `self` URI. See
  [Optimizing many requests](optimizing.md#embedding-resources).
* The response to an unsafe request (`POST`, `PUT`, `PATCH`, `DELETE`…) with a
  `Content-Location` header: the body is stored as the state of that URI,
  unless the request was made with `cache: 'no-store'`.

The cache stores copies: changing a state you got from `get()` does not
change the cache until you `put()` it or call `updateCache()`.

What expires the cache
----------------------

After a successful unsafe request on a URI, Ketting expires:

* the state of that URI;
* the URI in the response's `Location` header;
* every URI in a `Link` header with `rel="invalidates"`;
* every resource that depends on one of these through `inv-by` (below).

A `PUT` with a whole `State` does not expire the resource itself, since the
submitted state replaces it.

You can also expire caches yourself:

```typescript
// One resource, and the resources that depend on it.
resource.clearCache();

// Everything.
client.clearCache();
```

`refresh()` always does a new `GET` request, with `cache: 'no-cache'` so that
the browser's HTTP cache revalidates it with the server.

Cache dependencies with `inv-by`
--------------------------------

A server can tell Ketting that a resource must expire whenever another one
does, with an `inv-by` link from the [Linked Cache Invalidation draft][inv-by].
For example, an article that must expire whenever its collection expires:

```json
{
  "_links": {
    "self": { "href": "/articles/1" },
    "inv-by": { "href": "/articles" }
  },
  "title": "Hello world"
}
```

Here, `/articles/1` expires every time `/articles` expires. Dependencies are
followed recursively. `inv-by` links are read from every format, including
the `Link` header and embedded resources.

Events
------

Resources emit events when their cached state changes:

```typescript
resource.on('update', (state) => {
  console.log('New state:', state.data);
});

resource.on('stale', () => {
  // The cached state was expired. Call get() to fetch a new one.
});

resource.on('delete', () => {
  // A DELETE request succeeded on this resource.
});
```

* `update` - A new state was cached: from a `GET` response, a `PUT` with a
  whole state, `updateCache()`, an embedded resource or a
  `Content-Location` response. When it fires, all states embedded in the same
  response are already cached.
* `stale` - The cached state was expired, for any of the reasons above.
* `delete` - A `DELETE` request on the resource succeeded.

`once()` and `off()` are available too. Because Ketting keeps a single
`Resource` object per URI, every part of an application that listens to a
resource gets the same events.

Cache strategies
----------------

`client.cache` holds the cache. Ketting ships three implementations:

* `ForeverCache` (default) - Keeps states until they expire as described
  above. A change made on the server by someone else is not noticed until
  then.
* `ShortCache` - Like `ForeverCache`, but also drops each state a while after
  it was stored: 30 seconds by default, or the number of milliseconds passed
  to the constructor. A good fit when the server relies on HTTP caching
  headers, or when data must stay fresh.
* `NeverCache` - Stores nothing. Every `get()` does a request, and embedded
  resources are ignored. Mostly useful in tests.

```typescript
import { Client, ShortCache } from 'ketting';

const client = new Client('https://api.example/');
client.cache = new ShortCache(10_000);
```

You can also provide your own implementation of the `StateCache` interface.

Request de-duplication
----------------------

When several `get()` or `refresh()` calls for the same URI and headers are in
flight at the same time, Ketting only does one request and shares its result.

[inv-by]: https://datatracker.ietf.org/doc/html/draft-nottingham-linked-cache-inv
