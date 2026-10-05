![Logo](logo.png) Ketting - The HATEOAS client for javascript
==============================================================

Ketting is a generic REST client with hypermedia features, built on the
[Fetch API][fetch]. It works in browsers and in Node.js.

It works with any JSON-based HTTP API, but it gets superpowers with formats
that have links, such as [HAL][hal], [HAL Forms][hal-forms], [Siren][siren],
[JSON:API][jsonapi], [Collection+JSON][cj], HTML and the
[HTTP `Link` header][weblinking]. It follows links from a single bookmark URI,
submits hypermedia forms, caches resources and keeps that cache consistent,
and turns [`application/problem+json`][problem] responses into exceptions.

```typescript
import { Client } from 'ketting';

const client = new Client('https://api.example/');

// Follow a link with rel="author". This could be an HTML `<link>`, a HAL
// `_links` entry or an HTTP `Link` header.
const author = await client.follow('author');

// Grab the current state.
const authorState = await author.get();

// Change the firstName property of the object. Note that this assumes JSON.
authorState.data.firstName = 'Evert';

// Save the new state.
await author.put(authorState);
```

Contents
--------

* [Installation](#installation)
* [Getting started](#getting-started)
* [Hypermedia](#hypermedia)
* [Actions and forms](#actions-and-forms)
* [Caching and events](#caching-and-events)
* [Optimizing many requests](#optimizing-many-requests)
* [Authentication](#authentication)
* [Fetch middlewares](#fetch-middlewares)
* [Error handling](#error-handling)
* [TypeScript features](#typescript-features)
* [Deprecation warnings](#deprecation-warnings)
* [CORS header suggestions](#cors-header-suggestions)
* [React](#react)
* [Reference](#reference)

This readme documents the version it is part of. The documentation of a given
release is the readme of that release's git tag.


Installation
------------

Ketting is published on npm:

    npm i ketting

### Requirements

* Node.js 20 or later. Ketting relies on the native `fetch()`, `Request`,
  `Response`, `Headers`, `Blob` and `FormData` globals.
* Any modern browser.

Ketting is an ES module package that targets ES2023 and exposes its entry
point through `package.json#exports`.

### Node.js

```typescript
import { Client } from 'ketting';

const client = new Client('https://api.example/');
```

The default export is the same `Client` class, and it is also exported as
`Ketting`:

```typescript
import Ketting from 'ketting';

const client = new Ketting('https://api.example/');
```

CommonJS code can only load Ketting with `require()` on Node.js versions that
support requiring ES modules. Otherwise use a dynamic `import()`.

### Browsers

Ketting does not ship a pre-built browser bundle. Use it through a bundler
such as Vite, webpack, Rollup or esbuild; the instructions are the same as for
Node.js.

Bundlers pick up the browser build automatically: Ketting uses the `browser`
condition of `package.json#imports` to parse HTML with the browser's
`DOMParser` instead of the Node.js HTML parser.


Getting started
---------------

### The basics

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

### The State object

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
  body. See [Hypermedia](#hypermedia).
* `follow()`, `mayFollow()`, `followAll()` - Follow links synchronously. See
  [Hypermedia](#hypermedia).
* `action()`, `findAction()`, `actions()`, `hasAction()` - Work with
  hypermedia forms. See [Actions and forms](#actions-and-forms).
* `serializeBody()` - Turns the state into a body that can be sent in an HTTP
  request.
* `getEmbedded()` - Returns the states of embedded resources.
* `timestamp` - When the state was created, in milliseconds.
* `clone()` - Returns a copy of the state.

Everything on a `State` object is synchronous, which makes it convenient to
use in UI frameworks.

### Resources

#### GET, PUT and caching

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

See [Caching and events](#caching-and-events) for the details.

#### Request options

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

#### Creating resources with POST

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

#### RPC-like operations with POST and PATCH

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
the resource. See [Caching and events](#caching-and-events).

#### DELETE

`DELETE` requires no request body and returns nothing:

```typescript
await resource.delete();
```

#### HEAD

`head()` does a `HEAD` request and returns a `HeadState`: a state with
`uri`, `headers`, `links` and the `follow()` methods, but no body. If a
`GET` response is already cached, that state is returned instead.

```typescript
const headState = await resource.head();
const next = headState.follow('next');
```

#### fetch()

Resources have a `fetch()` method that behaves like the standard
[fetch()][fetch], but without the URI argument. Use it for requests that
the other methods do not cover. `fetchOrThrow()` does the same, but throws on
`4xx` and `5xx` responses.

Requests made this way go through the [fetch middlewares](#fetch-middlewares), so
they are authenticated and still expire the cache for unsafe methods.

#### go()

`client.go()` returns the resource for a URI. Resources also have a `go()`
method; a relative URI passed to it is resolved against the resource's URI.
Both also accept a `Link` object.

Neither makes an HTTP request. Ketting keeps a single `Resource` object per
URI, so calling `go()` twice with the same URI returns the same object.

#### follow(), mayFollow() and followAll()

These methods are Ketting's hypermedia features. They are covered in
[Hypermedia](#hypermedia).

### Errors

When the server replies with a `4xx` or `5xx` status, the methods above
throw an `HttpError`. See [Error handling](#error-handling).


Hypermedia
----------

If your REST API uses hypermedia, Ketting lets you navigate it by following
links, instead of building URIs yourself.

### Supported formats

Ketting picks up links from the [HTTP `Link` header][weblinking] of any
response, and from the body of the following formats:

| Format | Content type | Links | Embedded resources | Actions |
| --- | --- | --- | --- | --- |
| [HAL][hal] | `application/hal+json` | `_links` | `_embedded` | [HAL Forms][hal-forms] `_templates` |
| [HAL Forms][hal-forms] | `application/prs.hal-forms+json` | `_links` | `_embedded` | `_templates` |
| [Siren][siren] | `application/vnd.siren+json` | `links`, sub-entities | sub-entities | `actions` |
| [JSON:API][jsonapi] | `application/vnd.api+json` | `links` | | |
| [Collection+JSON][cj] | `application/vnd.collection+json` | `links`, `items`, `queries` | | |
| HTML | `text/html` | [`<a>`][html-a] and [`<link>`][html-link] with `rel` and `href` | | `<form>` |

Plain `application/json` responses, and any `application/*+json` type that is
not listed above, are parsed as HAL. Links of a JSON:API collection's
resource objects are exposed with the `item` relation.

Ketting sends an `Accept` header that lists all of these types. See
[Content types](docs/api.md#content-types) to change it.

### Following a link

Say our API has articles, and articles have an author. With HAL, the server
might return:

```json
{
  "_links": {
    "self": { "href": "/article/1" },
    "author": { "href": "/authors/123", "title": "Dr. Pidgin" }
  },
  "title": "Hello world!",
  "body": "..."
}
```

To get to the author, follow the link by its relation type ("rel"):

```typescript
import { Client } from 'ketting';

const client = new Client('https://api.example/');
const articleResource = client.go('/article/1');

const authorResource = await articleResource.follow('author');
```

`authorResource` is a `Resource` for `https://api.example/authors/123`.
`follow()` fetched the article to find the link; the author itself is not
fetched until you call `get()` on it.

If there is no link with that relation, `follow()` rejects with a
`LinkNotFound` error.

### Optional links

When a link may legitimately be absent, use `mayFollow()`. It works like
`follow()`, but gives `undefined` instead of an error:

```typescript
const state = await articleResource.get();
const editResource = state.mayFollow('edit');
if (editResource) {
  // The user may edit this article.
}

// Or in one line:
const authorState = await state.mayFollow('author')?.get();
```

`client.mayFollow()` does the same from the bookmark resource.

### Following many links

Our API has a home document that links to an article collection, which lists
every article as an `item` link:

```json
{
  "_links": {
    "self": { "href": "/" },
    "article-collection": { "href": "/articles", "title": "List of articles" },
    "author-collection": { "href": "/authors", "title": "List of authors" }
  },
  "motd": "Welcome to the blogging server!"
}
```

```json
{
  "_links": {
    "self": { "href": "/articles" },
    "item": [
      { "href": "/articles/1" },
      { "href": "/articles/2" },
      { "href": "/articles/3" }
    ],
    "next": { "href": "/articles?page=2" }
  },
  "total": 25
}
```

`followAll()` returns every resource with a given relation. If there are
none, the array is empty.

```typescript
const client = new Client('https://api.example/');

// Without an argument, go() returns the bookmark resource.
const home = client.go();

const articleCollection = await home.follow('article-collection');
const articleResources = await articleCollection.followAll('item');

for (const resource of articleResources) {
  const state = await resource.get();
  console.log(state.data);
}
```

Doing many `GET` requests in sequence can be slow. See
[Optimizing many requests](#optimizing-many-requests) for ways to speed this up.

### Chaining

`follow()` and `followAll()` return a promise-like object that can be
chained, to do several hops at once:

```typescript
const authorResource = await client.go()
  .follow('article-collection')
  .follow('item') // If there is more than one, the first one is used.
  .follow('author');
```

`client.follow()` is a shortcut for `client.go().follow()`.

You can also end a chain with `get()`, to get the state directly:

```typescript
const authorState = await client
  .follow('article-collection')
  .follow('item')
  .follow('author')
  .get();

// followAll() chains resolve to an array of states.
const articleStates = await client
  .follow('article-collection')
  .followAll('item')
  .get();
```

### Following links from a state

A `State` has `follow()`, `mayFollow()` and `followAll()` methods too. Because
the links are already there, they are synchronous and return resources
directly:

```typescript
const state = await articleCollection.get();

const next = state.follow('next');
const items = state.followAll('item');

// followAll() returns a Resources array, which can fetch all states at once.
const itemStates = await items.get();
```

### Templated links

Some formats support [URI templates][uri-template]. Here is a HAL collection
with a templated `search` link:

```json
{
  "_links": {
    "self": { "href": "/articles" },
    "search": {
      "href": "/articles{?q}",
      "templated": true
    }
  }
}
```

Pass the template variables as the second argument of `follow()`:

```typescript
const searchResult = await articleCollection.follow('search', { q: 'javascript' });
```

Array values expand to repeated query parameters.

### Mixing formats

Each hop can use a different format. The home document could be HTML:

```html
<ul>
  <li><a href="/articles" rel="article-collection">List of articles</a></li>
  <li><a href="/authors" rel="author-collection">List of authors</a></li>
</ul>
```

and the collection HAL, or Siren. The code above works unchanged.

### Reading and changing links

Links are not part of `state.data`. They are in `state.links`, a `Links`
object that is the same whatever the format:

```typescript
const state = await articleResource.get();

state.links.has('author');       // true
state.links.get('author');       // The first 'author' link, or undefined
state.links.getMany('author');   // All 'author' links
state.links.getAll();            // All links
```

Links can also be changed, and sent back to the server:

```typescript
const state = await articleResource.get();

state.links.add('category', '/category/5');
// Or: state.links.add({ rel: 'category', href: '/category/5', title: 'News' });

await articleResource.put(state);
```

For HAL, the `PUT` body puts the links back into `_links`:

```json
{
  "_links": {
    "self": { "href": "/article/1" },
    "author": { "href": "/authors/123", "title": "Dr. Pidgin" },
    "category": { "href": "/category/5" }
  },
  "title": "Hello world!",
  "body": "..."
}
```

`set()` replaces all links with a relation, and `delete()` removes them. See
the [API reference](docs/api.md#links) for every method.


Actions and forms
-----------------

Some hypermedia formats describe the operations a client can perform, not
just the links it can follow. Ketting exposes these as *actions*, and supports:

* [HAL Forms][hal-forms] `_templates`, in `application/prs.hal-forms+json`,
  `application/hal+json` and plain JSON responses.
* [Siren][siren] `actions`.
* HTML `<form>` elements. Their fields are not parsed yet.

An action has a target `uri`, a `method`, a `contentType`, an optional `name`
and `title`, and a list of `fields`.

Given this HAL Forms document:

```json
{
  "_links": {
    "self": { "href": "/articles/1/messages" }
  },
  "_templates": {
    "send-message": {
      "method": "POST",
      "contentType": "application/json",
      "properties": [
        { "name": "body", "type": "textarea", "required": true },
        { "name": "priority", "type": "number", "value": 1 }
      ]
    }
  }
}
```

### Finding an action

Actions are on the `State` object:

```typescript
const state = await resource.get();

state.hasAction('send-message'); // true
state.hasAction();               // true if there is any action

const action = state.action('send-message');

// Same as action(), but returns undefined instead of throwing.
const maybeAction = state.findAction('send-message');

// All actions.
const allActions = state.actions();
```

`action()` throws an `ActionNotFound` error if the action does not exist.
Without a name, `action()` and `findAction()` return the first action, which is
handy for formats that only have one.

### Submitting an action

`submit()` sends the form and returns the response as a `State`:

```typescript
const responseState = await state
  .action('send-message')
  .submit({ body: 'Hi!' });
```

When the action is a `POST` that creates a resource, `submitFollow()`
returns the new `Resource` instead. It follows the same rules as
[`postFollow()`](#creating-resources-with-post):

```typescript
const messageResource = await state
  .action('send-message')
  .submitFollow({ body: 'Hi!' });
```

Before sending, Ketting:

* adds the pre-filled `value` of every field you did not provide, such as
  `priority` above;
* throws an error if a `required` field is missing and has no value.

The form data is encoded according to the action's `contentType`:

| Content type | Encoding |
| --- | --- |
| `application/json` | JSON |
| `application/x-www-form-urlencoded` | URL-encoded form |
| `multipart/form-data` | `FormData`; `Blob` and `File` values are sent as file parts |
| anything else | not supported, `submit()` throws |

When the action's method is `GET`, the form data is put in the query string
of the target URI and the result is fetched like any other resource.

### Uploading files

With a `multipart/form-data` action, pass `Blob` or `File` values for file
fields. A `Uint8Array` (such as a Node.js `Buffer`) is sent as a binary part
too. Arrays are sent as repeated parts.

```typescript
const attachment = new Blob(['Hello'], { type: 'text/plain' });

await state
  .action('upload')
  .submit({ title: 'My file', attachment });
```

### Fields

`action.fields` describes the form's fields, so a UI can render it.
`action.field(name)` returns a single field.

Every field has a `name`, a `type`, `required`, `readOnly`, and optionally a
`label`, a `placeholder` and a pre-filled `value`. Depending on the type, it
has extra properties:

| Type | Field type | Extra properties |
| --- | --- | --- |
| `text` | `TextField` | `minLength`, `maxLength`, `pattern` |
| `textarea` | `TextAreaField` | `minLength`, `maxLength`, `cols`, `rows` |
| `color`, `email`, `password`, `search`, `tel`, `url` | `BasicStringField` | `minLength`, `maxLength` |
| `number`, `range` | `NumberField` | `min`, `max`, `step` |
| `date`, `month`, `time`, `week` | `RangeStringField` | `min`, `max`, `step` |
| `datetime`, `datetime-local` | `DateTimeField` | `min`, `max`, `step` |
| `checkbox`, `radio` | `BooleanField` | |
| `hidden` | `HiddenField` | |
| `file` | `FileField` | |
| `select` | `SelectFieldSingle` or `SelectFieldMulti` | see below |

A HAL Forms property with `options` becomes a `select` field. `multiple`
tells whether one or several values can be selected, and `renderAs` hints at
how to render it (`dropdown`, `radio` or `checkbox`). The pre-filled
selection is in `selectedValue` (single) or `selectedValues` (multi); `value`
is deprecated.

A select field has exactly one of these option sources:

* `options` - The HAL Forms `inline` options, as a record mapping each value
  to its label.
* `dataSource` - The HAL Forms `link` options: a URI to fetch the options
  from, with its `type`, `labelField` and `valueField`.
* `linkSource` - A URI and a link relation: the options are the links with
  that relation on that resource. No built-in format produces it yet.

Ketting does not fetch `dataSource` or `linkSource` options itself.


Caching and events
------------------

Ketting keeps the `State` of every resource it fetched in a cache, so that
`get()` does not hit the server again. This section explains when the cache is
filled, when it is expired, and how to react to changes.

### What fills the cache

* A `GET` response, from `get()` or `refresh()`.
* A `PUT` with a whole `State` object: the submitted state becomes the cached
  state once the server accepted it.
* `resource.updateCache(state)`, which stores a state without any request.
* Embedded resources, such as HAL `_embedded` items and Siren sub-entities.
  Each one is stored under its own `self` URI. See
  [Optimizing many requests](#embedding-resources).
* The response to an unsafe request (`POST`, `PUT`, `PATCH`, `DELETE`…) with a
  `Content-Location` header: the body is stored as the state of that URI,
  unless the request was made with `cache: 'no-store'`.

The cache stores copies: changing a state you got from `get()` does not
change the cache until you `put()` it or call `updateCache()`.

### What expires the cache

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

### Cache dependencies with `inv-by`

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

### Events

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

### Cache strategies

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

### Request de-duplication

When several `get()` or `refresh()` calls for the same URI and headers are in
flight at the same time, Ketting only does one request and shares its result.


Optimizing many requests
------------------------

Well-designed hypermedia APIs have many small resources, each with its own
URI. Take this article collection:

```json
{
  "_links": {
    "self": { "href": "/articles" },
    "item": [
      { "href": "/articles/1" },
      { "href": "/articles/2" },
      { "href": "/articles/3" }
    ]
  }
}
```

Printing every article naively looks like this:

```typescript
const articleResources = await articleCollection.followAll('item');

for (const resource of articleResources) {
  const state = await resource.get();
  console.log(state.data);
}
```

With an empty cache, this does one `GET` request per article, one after the
other. Here are the ways to make it faster.

### Parallelize

Fetch all states at once:

```typescript
const articleStates = await articleCollection.followAll('item').get();

for (const state of articleStates) {
  console.log(state.data);
}
```

`get()` on the result of `followAll()` fires all requests in parallel. This
helps with HTTP/1.1, and a lot with HTTP/2, which multiplexes all requests
over one connection.

### Prefetch

`preFetch()` starts fetching the followed resources in the background, while
your code keeps processing them one by one:

```typescript
const articleResources = await articleCollection
  .followAll('item')
  .preFetch();

for (const resource of articleResources) {
  // The request is already in flight, or done.
  const state = await resource.get();
  console.log(state.data);
}
```

Identical requests that are in flight at the same time are de-duplicated, and
resources that are already cached are not fetched again. `preFetch()` works on
`follow()` too.

### Embedding resources

Embedding (also called compound documents or transclusion) lets one response
carry the state of other resources. HAL does this with `_embedded`, Siren with
sub-entities:

```json
{
  "_links": {
    "self": { "href": "/articles" },
    "item": [
      { "href": "/articles/1" },
      { "href": "/articles/2" }
    ]
  },
  "_embedded": {
    "item": [
      {
        "_links": { "self": { "href": "/articles/1" } },
        "title": "Welcome to my blog!"
      },
      {
        "_links": { "self": { "href": "/articles/2" } },
        "title": "Second post!"
      }
    ]
  }
}
```

Ketting caches every embedded resource under its `self` URI, so the loop at the
top of this section does no further request. Embedded HAL items without a `self`
link are ignored, with a warning. Embedded HAL resources are also exposed as links
with their relation, so `followAll('item')` finds them even if `_links` does
not list them.

The advantage of embedding is that the server controls it. When a path turns
out to be slow, the server can start embedding the related resources, and
clients benefit without any change.

### Asking the server to embed

`preferTransclude()` sends a [`Prefer: transclude`][prefer-transclude] header
with the relation being followed, asking the server to embed those resources:

```typescript
const articleResources = await articleCollection
  .followAll('item')
  .preferTransclude();
```

```http
GET /articles HTTP/1.1
Prefer: transclude=item
```

Servers that do not support it ignore the header.

### Using HEAD requests

If your server puts its links in `Link` headers, `useHead()` makes `follow()`
and `followAll()` find them with a `HEAD` request instead of a `GET`:

```typescript
const author = await articleResource
  .follow('author')
  .useHead();
```

### Further reading

* [Performance testing HTTP/1.1 vs HTTP/2 vs HTTP/2 + Server Push for REST
  APIs][h2-parallelism] - Evert Pot
* [Let's Stop Building APIs Around a Network Hack][network-hack] - Phil
  Sturgeon


Authentication
--------------

Authentication is implemented with [fetch middlewares](#fetch-middlewares) that add
an `Authorization` header to requests. Ketting ships middlewares for:

* HTTP Basic authentication
* Bearer tokens
* OAuth2, through [@badgateway/oauth2-client][oauth2-client]

### Basic authentication

```typescript
import { Client, basicAuth } from 'ketting';

const client = new Client('https://api.example/');
client.use(basicAuth('userName', 'password'));
```

### Bearer token

If you already have a [bearer token][bearer] and it does not need to be
refreshed:

```typescript
import { Client, bearerAuth } from 'ketting';

const client = new Client('https://api.example/');
client.use(bearerAuth('Your secret token goes here'));
```

### OAuth2

Use `OAuth2Fetch` from [@badgateway/oauth2-client][oauth2-client]. It gets
tokens, adds them to requests, and refreshes them when they expire or when the
server replies `401`. Its `mw()` method returns a Ketting fetch middleware:

    npm i @badgateway/oauth2-client

```typescript
import { Client } from 'ketting';
import { OAuth2Client, OAuth2Fetch } from '@badgateway/oauth2-client';

const oauth2Client = new OAuth2Client({
  server: 'https://auth.example/',
  clientId: 'my-client-id',
  clientSecret: 'my-client-secret',
});

const oauth2Fetch = new OAuth2Fetch({
  client: oauth2Client,
  getNewToken: () => oauth2Client.clientCredentials(),
});

const client = new Client('https://api.example/');
client.use(oauth2Fetch.mw());
```

`getNewToken()` can use any grant the library supports, such as
`oauth2Client.password({ username, password })` or
`oauth2Client.authorizationCode.getToken({ code, redirectUri, codeVerifier })`.
`storeToken` and `getStoredToken` let you persist tokens between sessions.
See the library's documentation for all options, including PKCE and token
introspection.

The `authorization_code` grant starts with redirecting the user to the
authorization server, and ends with the server redirecting back to your
application with a `code`. That navigation is out of Ketting's scope: Ketting
only exchanges the code for a token and talks to the API.

#### The deprecated `oauth2()` middleware

Ketting still exports an `oauth2()` function, which wraps
`@badgateway/oauth2-client` behind the options format of older Ketting
versions. It logs a deprecation warning and will be removed in the next major
version. Replace it with `OAuth2Fetch` as shown above.

| `oauth2()` option | `@badgateway/oauth2-client` equivalent |
| --- | --- |
| `clientId`, `clientSecret`, `tokenEndpoint` | `new OAuth2Client({ clientId, clientSecret, tokenEndpoint })` |
| `grantType: 'client_credentials'`, `scope` | `getNewToken: () => client.clientCredentials({ scope })` |
| `grantType: 'password'`, `userName`, `password`, `scope` | `getNewToken: () => client.password({ username, password, scope })` |
| `grantType: 'authorization_code'`, `code`, `redirectUri`, `codeVerifier` | `getNewToken: () => client.authorizationCode.getToken({ code, redirectUri, codeVerifier })` |
| second argument: an existing token | `getStoredToken: () => token` |
| `onTokenUpdate` | `storeToken` |
| `onAuthError` | `onError` |

### Authentication per origin

By default, a middleware applies to every request, whatever the domain. When
Ketting follows links to other domains, you may not want to send your
credentials there. Pass an origin as the second argument of `use()`:

```typescript
client.use(bearerAuth('...'), 'https://api.example');
client.use(basicAuth('userName', 'password'), 'https://*.example.org');
```

The pattern is matched against the request's whole origin: scheme, host and
port, without a trailing slash. `*` matches any sequence of characters, so
`'https://*.example.org'` matches every subdomain of `example.org` over HTTPS.


Fetch middlewares
-----------------

Every HTTP request Ketting makes goes through a chain of *fetch middlewares*.
A middleware receives a [`Request`][request] and a `next` function, and returns
a `Promise<Response>`. It can change the request, change the response, or
answer without calling `next` at all.

```typescript
import { Client, type FetchMiddleware } from 'ketting';

const addApiKey: FetchMiddleware = (request, next) => {
  request.headers.set('X-Api-Key', 'secret');
  return next(request);
};

const client = new Client('https://api.example/');
client.use(addApiKey);
```

A middleware that logs slow requests:

```typescript
client.use(async (request, next) => {
  const start = Date.now();
  const response = await next(request);
  const duration = Date.now() - start;
  if (duration > 1000) {
    console.warn(`${request.method} ${request.url} took ${duration}ms`);
  }
  return response;
});
```

Middlewares run in the order they were added. Like
[authentication](#authentication-per-origin) middlewares,
any middleware can be restricted to an origin pattern with the second argument
of `use()`:

```typescript
client.use(addApiKey, 'https://api.example');
```

### Built-in behavior

Ketting itself uses middlewares, which run before yours. They:

* set a default `Accept` header, built from `client.contentTypeMap`;
* expire and fill the cache after unsafe requests, as described in
  [Caching and events](#caching-and-events);
* log [deprecation warnings](#deprecation-warnings).

At the end of the chain, Ketting sets the `User-Agent` header to
`Ketting/<version>` if the request does not have one yet, and calls the
global `fetch()`. To leave `User-Agent` alone, set
`client.fetcher.advertiseKetting = false`.

Requests from `resource.fetch()`, `resource.fetchOrThrow()` and action
submissions go through the same chain.


Error handling
--------------

### HTTP errors

When the server replies with a `4xx` or `5xx` status, `get()`, `put()`,
`post()`, `follow()`, action submissions and the other request methods reject
with an `HttpError`. Only `resource.fetch()` returns error responses instead of
throwing.

`HttpError` has:

* `status` - The HTTP status code.
* `response` - The fetch `Response`.

```typescript
import { HttpError } from 'ketting';

try {
  await resource.get();
} catch (err) {
  if (err instanceof HttpError && err.status === 404) {
    // Not found.
  } else {
    throw err;
  }
}
```

### Problem details

If the error response has the `application/problem+json` content type
([RFC 9457][problem], formerly RFC 7807), Ketting throws a `Problem` instead.
`Problem` extends `HttpError` and adds the parsed `body`:

* `body.type` - Defaults to `about:blank`.
* `body.status` - Defaults to the response status.
* `body.title`, `body.detail`, `body.instance`, and any extension member.

When the problem has a `title`, the error message is
`HTTP Error <status>: <title>`.

```typescript
import { Problem } from 'ketting';

try {
  await resource.put(state);
} catch (err) {
  if (err instanceof Problem) {
    console.error(err.body.title, err.body.detail);
  }
  throw err;
}
```

### Other errors

* `LinkNotFound` - `follow()` found no link with the requested relation. Use
  [`mayFollow()`](#optional-links) for optional links.
* `ActionNotFound` - `state.action()` found no matching action. Use
  [`findAction()`](#finding-an-action) when the action is optional.
* Network failures are the errors thrown by `fetch()` itself.


TypeScript features
-------------------

Ketting is written in TypeScript and ships its type declarations. They work
with `skipLibCheck: false`, and do not require `@types/node`.

### Typed resources

`Resource` and `State` take a generic type argument that describes the
resource's data. It defaults to `any`:

```typescript
// Resource<any>
const authorResource = await articleResource.follow('author');
```

When you know the shape of the data, pass it to the method that returns the
resource:

```typescript
type Author = {
  firstName: string;
  lastName: string;
};

// Resource<Author>
const authorResource = await articleResource.follow<Author>('author');

// State<Author>
const authorState = await authorResource.get();

// string
const firstName = authorState.data.firstName;
```

The same generic is available on every method that returns resources:

```typescript
client.go<Author>('/authors/1');
resource.go<Author>('../authors/1');
client.follow<Author>('author');
await client.mayFollow<Author>('author');   // Resource<Author> | undefined
resource.followAll<Author>('item');          // resolves to Resource<Author>[]
state.follow<Author>('author');
state.mayFollow<Author>('author');           // Resource<Author> | undefined
state.followAll<Author>('item');             // Resources<Author>
```

A typed resource types `get()`, `refresh()` and `getCache()` with the data
type, and the `data` passed to `put()`:

```typescript
class Resource<T = any> {
  get(options?: GetRequestOptions): Promise<State<T>>;
  refresh(options?: GetRequestOptions): Promise<State<T>>;
  getCache(): State<T> | null;
  put(options: PutRequestOptions<T> | State): Promise<void>;
  patch(options: PatchRequestOptions): Promise<State<T> | undefined>;
  post(options: PostRequestOptions): Promise<State>;
  postFollow(options: PostRequestOptions): Promise<Resource>;
}
```

The request bodies of `post()` and `patch()`, and the resource returned by
`postFollow()`, are not typed.

### Typed actions

`action()` and `findAction()` take the type of the form data:

```typescript
type Message = { body: string };

await state.action<Message>('send-message').submit({ body: 'Hi!' });
```

### Typed fields

`Field` is a union discriminated on `type` (and on `multiple` for `select`),
so you can narrow it:

```typescript
for (const field of action.fields) {
  if (field.type === 'number') {
    console.log(field.min, field.max);
  }
}
```

The individual field types, such as `TextField` and `SelectFieldMulti`, are
exported. See [Actions and forms](#fields).


Deprecation warnings
--------------------

If your API has deprecated endpoints or links, Ketting logs a warning with
`console.warn()`, so developers notice they still rely on them.

### Deprecated resources

A server can mark a resource as deprecated with the
[`Deprecation` header][deprecation]:

```http
Deprecation: @1688169599
```

It can also announce when the resource will stop responding with the
[`Sunset` header][sunset], and link to more information with the
`deprecation` link relation:

```http
Sunset: Sun, 30 Jun 2024 23:59:59 GMT
Link: </docs/migration-2024>; rel="deprecation"
```

When a response has a `Deprecation` header, whatever its value, Ketting logs
the request URI, the `Sunset` date and the `deprecation` links, if any.

### Deprecated links

A single link can be deprecated with a `status` [link hint][link-hint]. In
HAL:

```json
{
  "_links": {
    "next": {
      "href": "/next-page",
      "hints": {
        "status": "deprecated"
      }
    }
  }
}
```

Following such a link with `follow()`, `mayFollow()` or `followAll()` logs a
warning:

```typescript
// Logs a warning.
const nextResource = await resource.follow('next');
```


CORS header suggestions
-----------------------

When Ketting runs in a browser and the API is on another origin, the API must
allow it with [CORS][cors] headers. This set enables every Ketting feature:

```http
Access-Control-Allow-Origin: https://your-app.example
Access-Control-Allow-Methods: GET, HEAD, POST, PUT, PATCH, DELETE
Access-Control-Allow-Headers: Accept, Authorization, Content-Type, Prefer
Access-Control-Expose-Headers: Content-Location, Deprecation, Link, Location, Sunset
```

A good rule of thumb is to only allow what you need.

### Request headers

* `Accept` - Sent with every request, listing the
  [supported formats](#supported-formats).
* `Authorization` - Only sent by the [authentication](#authentication)
  middlewares.
* `Content-Type` - Sent with `PUT`, `POST` and `PATCH` requests. It defaults
  to `application/json`, which is not a CORS-safelisted value.
* `Prefer` - Only sent by
  [`preferTransclude()`](#asking-the-server-to-embed).

Ketting also sets `User-Agent` to `Ketting/<version>`, but browsers may ignore
it. See [Fetch middlewares](#built-in-behavior) to disable it.

### Response headers

Browsers hide response headers from scripts unless they are exposed:

* `Link` - Links, and the `invalidates`, `inv-by` and `deprecation`
  relations.
* `Location` - Needed by `postFollow()` and `submitFollow()` to find a created
  resource, and expires its cache.
* `Content-Location` - Lets Ketting cache the response of an unsafe request.
  See [Caching and events](#caching-and-events).
* `Deprecation` and `Sunset` - [Deprecation warnings](#deprecation-warnings).


React
-----

React bindings for Ketting are a separate project,
[react-ketting][react-ketting]. It provides hooks such as `useResource`,
`useCollection` and `useClient`, with an API inspired by Apollo Client, and has
its own documentation.

Check the `ketting` peer dependency of the `react-ketting` version you install:
it may not support the latest major version of Ketting yet.


Reference
---------

* [API reference](docs/api.md)
* [Upgrading between major versions](docs/upgrading.md)
* [Changelog](changelog.md)

[bearer]: https://www.rfc-editor.org/rfc/rfc6750
[cj]: http://amundsen.com/media-types/collection/
[cors]: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
[deprecation]: https://www.rfc-editor.org/rfc/rfc9745
[fetch]: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
[h2-parallelism]: https://evertpot.com/h2-parallelism/
[hal]: https://datatracker.ietf.org/doc/html/draft-kelly-json-hal
[hal-forms]: https://rwcbook.github.io/hal-forms/
[html-a]: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a
[html-link]: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/link
[inv-by]: https://datatracker.ietf.org/doc/html/draft-nottingham-linked-cache-inv
[jsonapi]: https://jsonapi.org/
[link-hint]: https://datatracker.ietf.org/doc/html/draft-nottingham-link-hint
[network-hack]: https://apisyouwonthate.com/blog/lets-stop-building-apis-around-a-network-hack
[oauth2-client]: https://www.npmjs.com/package/@badgateway/oauth2-client
[prefer-transclude]: https://github.com/inadarei/draft-prefer-transclude/blob/master/draft.md
[problem]: https://www.rfc-editor.org/rfc/rfc9457
[react-ketting]: https://www.npmjs.com/package/react-ketting
[request]: https://developer.mozilla.org/en-US/docs/Web/API/Request
[siren]: https://github.com/kevinswiber/siren
[sunset]: https://www.rfc-editor.org/rfc/rfc8594
[uri-template]: https://www.rfc-editor.org/rfc/rfc6570
[weblinking]: https://www.rfc-editor.org/rfc/rfc8288
