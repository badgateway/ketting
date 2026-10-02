Getting started
===============

The basics
----------

Ketting has two primitives that are important to learn:

* A `Resource`, which represents a single endpoint, identified by its URI.
* A `State`, which represents the result of a `GET` request, or what you would
  submit with a `PUT` request.

Let's assume that we have a REST API that manages blog articles. Each article
is encoded in JSON and looks like this:

```json
{
  "title": "First article",
  "body": "..."
}
```

The API's root (or home) is at `https://api.example/`, and our goal is to:

1. Grab the article located at `/article/1`.
2. Update the title.
3. Submit the result back to the server.

```typescript
import { Client } from 'ketting';

// The URI passed here is the 'bookmark'. Relative URIs are resolved against it.
const client = new Client('https://api.example/');

// Get the resource. This does not make any HTTP request.
const articleResource = client.go('/article/1');

// Get the state. This does a GET request.
const articleState = await articleResource.get();

// Update the title.
articleState.data.title = 'Hello world v2';

// Save the article.
await articleResource.put(articleState);
```

The State object
----------------

A `State` object represents either a response body, or a request body in
cases like `PUT`. Usually you get one from a resource:

```typescript
const state = await resource.get();
```

It has the following properties and methods:

* `uri` - The absolute URI the state belongs to.
* `data` - The parsed response body. For JSON-based formats this is the
  result of `JSON.parse()`. HAL's `_links`, `_embedded` and `_templates`
  are removed from it, and for Siren it holds the entity's `properties`. For
  `text/*` responses (including HTML) it is a `string`. For any other content
  type it is a `Blob`.
* `headers` - All HTTP headers of the response.
* `contentHeaders()` - The subset of headers that describe the content, such
  as `Content-Type`, `Content-Language`, `ETag` and `Last-Modified`.
* `links` - All links found in the HTTP `Link` header and in the response
  body. See [Hypermedia](hypermedia.md).
* `follow()`, `mayFollow()`, `followAll()` - Follow links synchronously. See
  [Hypermedia](hypermedia.md).
* `action()`, `findAction()`, `actions()`, `hasAction()` - Work with
  hypermedia forms. See [Actions and forms](actions.md).
* `serializeBody()` - Turns the state into a body that can be sent in an HTTP
  request.
* `getEmbedded()` - Returns the states of embedded resources.
* `timestamp` - When the state was created, in milliseconds.
* `clone()` - Returns a copy of the state.

Everything on a `State` object is synchronous, which makes it convenient to
use in UI frameworks.

Resources
---------

### GET, PUT and caching

`resource.get()` returns a `State`, and `resource.put()` sends one back to the
server.

Ketting assumes that *what you `PUT`* to a URI has more or less the same shape
as what you `GET` from it right after. This lets Ketting cache aggressively.

In the following example, only one `GET` request is made:

```typescript
const state1 = await resource.get();

// Served from the cache. The returned object is a copy.
const state2 = await resource.get();

state2.data.title = 'Hello again';

// After a successful PUT, the submitted state is placed in the cache.
await resource.put(state2);

// Served from the cache again, and reflects the last PUT.
const state3 = await resource.get();
console.log(state3.data.title); // 'Hello again'
```

The following cache operations are also available:

```typescript
// Remove the cached state of this resource.
resource.clearCache();

// Store a state in the cache, without doing a request.
resource.updateCache(state);

// Return the cached state synchronously, or null.
const cached = resource.getCache();

// Do a GET request that bypasses the cache.
const fresh = await resource.refresh();
```

See [Caching and events](caching.md) for the details.

### Request options

`get()`, `refresh()` and `head()` accept an options object with `headers`.
`put()`, `post()`, `postFollow()` and `patch()` also accept `data`:

```typescript
await resource.put({
  data: {
    title: 'This is the new body for PUT',
  },
  headers: {
    'Content-Type': 'application/json',
  },
});
```

* `data` is JSON-encoded, unless it is a `string`, a `Uint8Array` (such as a
  Node.js `Buffer`) or a `Blob`, which are sent as-is.
* `Content-Type` defaults to `application/json`.
* Instead of `data`, you can pass a `serializeBody()` function that returns
  the body. That is what happens when you pass a whole `State`.

### Creating resources with POST

A common REST pattern is to create resources with `POST`. Ketting has a
dedicated method for this: `postFollow()`. For it to work, the server must
reply with `201 Created` and a `Location` header pointing to the new resource.

```typescript
const newArticleResource = await collectionResource.postFollow({
  data: {
    title: 'Second post!',
    body: '...',
  },
});
```

`postFollow()` returns the new `Resource`. If the server replies with
`204 No Content` or `205 Reset Content` instead, it returns the resource the
request was sent to. Any other status is an error.

### RPC-like operations with POST and PATCH

To do an RPC-like operation such as sending an email, use `post()`. It
returns the response as a `State`:

```typescript
const result = await resource.post({
  data: {
    to: 'mom@example.org',
    subject: 'Sup',
  },
});
```

`patch()` works the same way. If the server replies with `200 OK`, it returns
the response as a `State`; otherwise it returns `undefined`.

Every successful `POST`, `PUT`, `PATCH` or `DELETE` expires the cached state of
the resource. See [Caching and events](caching.md).

### DELETE

`DELETE` requires no request body and returns nothing:

```typescript
await resource.delete();
```

### HEAD

`head()` does a `HEAD` request and returns a `HeadState`: a state with
`uri`, `headers`, `links` and the `follow()` methods, but no body. If a
`GET` response is already cached, that state is returned instead.

```typescript
const headState = await resource.head();
const next = headState.follow('next');
```

### fetch()

Resources have a `fetch()` method that behaves like the standard
[fetch()][fetch], but without the URI argument. Use it for requests that
the other methods do not cover. `fetchOrThrow()` does the same, but throws on
`4xx` and `5xx` responses.

Requests made this way go through the [fetch middlewares](middlewares.md), so
they are authenticated and still expire the cache for unsafe methods.

### go()

`client.go()` returns the resource for a URI. Resources also have a `go()`
method; a relative URI passed to it is resolved against the resource's URI.
Both also accept a `Link` object.

Neither makes an HTTP request. Ketting keeps a single `Resource` object per
URI, so calling `go()` twice with the same URI returns the same object.

### follow(), mayFollow() and followAll()

These methods are Ketting's hypermedia features. They are covered in
[Hypermedia](hypermedia.md).

Errors
------

When the server replies with a `4xx` or `5xx` status, the methods above
throw an `HttpError`. See [Error handling](errors.md).

Next steps
----------

* [Hypermedia](hypermedia.md)
* [Authentication](authentication.md)
* [Caching and events](caching.md)
* [Optimizing many requests](optimizing.md)

[fetch]: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
