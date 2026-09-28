Upgrading between major versions
================================

This page lists what you may have to change when upgrading. The
[changelog](../changelog.md) has the full list of changes of every release.

Ketting 8 to 9
--------------

* Node.js 20 or later is required.
* Ketting is now an ES module package targeting ES2023. Its entry point is
  defined by `package.json#exports`, so deep imports such as
  `ketting/dist/...` no longer work. Import everything from `ketting`.
* CommonJS code can only `require('ketting')` on Node.js versions that support
  requiring ES modules.

Ketting 7 to 8
--------------

* Node.js 18 or later is required. Ketting uses the native `fetch()` and no
  longer depends on `node-fetch`.
* The minified browser build (`browser/ketting.min.js`) is no longer
  published. Use a bundler. See [Installation](installation.md#browsers).
* The `oauth2()` middleware now uses
  [@badgateway/oauth2-client][oauth2-client] and is deprecated. Its OAuth2
  scopes option is named `scope`. Prefer `OAuth2Fetch` from that library; see
  [Authentication](authentication.md#oauth2).
* Submitting an action without one of its required fields now throws.
* Actions now submit the pre-filled values of fields you do not provide.

Ketting 6 to 7
--------------

* `Prefer-Push` support was removed, and with it `preferPush()`. Browsers
  dropped HTTP/2 Server Push.
* States have `follow()` and `followAll()` methods.
* Responses with a `Content-Location` header are now cached.
* Relative URIs in embedded HAL documents are resolved against the embedded
  document's `self` link, not the parent's (7.2.0).
* Custom format parsers must be updated: the `State` interface changed.

Ketting 5 to 6
--------------

Ketting 6 introduced `State` objects and fetch middlewares.

### get() returns a State

```typescript
// Ketting 5
const body = await resource.get();

// Ketting 6 and later
const state = await resource.get();
const body = state.data;
```

Request bodies are wrapped the same way:

```typescript
// Ketting 5
await resource.put({ title: 'Hello world' });

// Ketting 6 and later
await resource.put({ data: { title: 'Hello world' } });
```

### Links come from the state

`Resource.link()`, `Resource.links()` and `Resource.hasLink()` are deprecated:

```typescript
// Ketting 5
const link = await resource.link('rel');
const links = await resource.links('rel');
const hasLink = await resource.hasLink('rel');

// Ketting 6 and later
const state = await resource.get();
const link = state.links.get('rel');
const links = state.links.getMany('rel');
const hasLink = state.links.has('rel');
```

### getResource() is removed

`Client.getResource()` and `Resource.getResource()` were renamed to `go()`.

### post() is split in two

* `post()` is for RPC-style requests, and resolves to the response `State`.
* `postFollow()` creates a resource and resolves to it. Most Ketting 5 uses of
  `post()` should become `postFollow()`.

### Authentication is set up with middlewares

```typescript
// Ketting 5
const client = new Client('https://api.example/', {
  auth: {
    type: 'basic',
    userName: 'foo',
    password: 'bar',
  },
});

// Ketting 6 and later
const client = new Client('https://api.example/');
client.use(basicAuth('foo', 'bar'));
```

See [Authentication](authentication.md).

[oauth2-client]: https://www.npmjs.com/package/@badgateway/oauth2-client
