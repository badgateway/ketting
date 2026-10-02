Fetch middlewares
=================

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
[authentication](authentication.md#authentication-per-origin) middlewares,
any middleware can be restricted to an origin pattern with the second argument
of `use()`:

```typescript
client.use(addApiKey, 'https://api.example');
```

Built-in behavior
-----------------

Ketting itself uses middlewares, which run before yours. They:

* set a default `Accept` header, built from `client.contentTypeMap`;
* expire and fill the cache after unsafe requests, as described in
  [Caching and events](caching.md);
* log [deprecation warnings](deprecation-warnings.md).

At the end of the chain, Ketting sets the `User-Agent` header to
`Ketting/<version>` if the request does not have one yet, and calls the
global `fetch()`. To leave `User-Agent` alone, set
`client.fetcher.advertiseKetting = false`.

Requests from `resource.fetch()`, `resource.fetchOrThrow()` and action
submissions go through the same chain.

[request]: https://developer.mozilla.org/en-US/docs/Web/API/Request
