CORS header suggestions
=======================

When Ketting runs in a browser and the API is on another origin, the API must
allow it with [CORS][cors] headers. This set enables every Ketting feature:

```http
Access-Control-Allow-Origin: https://your-app.example
Access-Control-Allow-Methods: GET, HEAD, POST, PUT, PATCH, DELETE
Access-Control-Allow-Headers: Accept, Authorization, Content-Type, Prefer
Access-Control-Expose-Headers: Content-Location, Deprecation, Link, Location, Sunset
```

A good rule of thumb is to only allow what you need.

Request headers
---------------

* `Accept` - Sent with every request, listing the
  [supported formats](hypermedia.md#supported-formats).
* `Authorization` - Only sent by the [authentication](authentication.md)
  middlewares.
* `Content-Type` - Sent with `PUT`, `POST` and `PATCH` requests. It defaults
  to `application/json`, which is not a CORS-safelisted value.
* `Prefer` - Only sent by
  [`preferTransclude()`](optimizing.md#asking-the-server-to-embed).

Ketting also sets `User-Agent` to `Ketting/<version>`, but browsers may ignore
it. See [Fetch middlewares](middlewares.md#built-in-behavior) to disable it.

Response headers
----------------

Browsers hide response headers from scripts unless they are exposed:

* `Link` - Links, and the `invalidates`, `inv-by` and `deprecation`
  relations.
* `Location` - Needed by `postFollow()` and `submitFollow()` to find a created
  resource, and expires its cache.
* `Content-Location` - Lets Ketting cache the response of an unsafe request.
  See [Caching and events](caching.md).
* `Deprecation` and `Sunset` - [Deprecation warnings](deprecation-warnings.md).

[cors]: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
