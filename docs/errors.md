Error handling
==============

HTTP errors
-----------

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

Problem details
---------------

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

Other errors
------------

* `LinkNotFound` - `follow()` found no link with the requested relation. Use
  [`mayFollow()`](hypermedia.md#optional-links) for optional links.
* `ActionNotFound` - `state.action()` found no matching action. Use
  [`findAction()`](actions.md#finding-an-action) when the action is optional.
* Network failures are the errors thrown by `fetch()` itself.

[problem]: https://www.rfc-editor.org/rfc/rfc9457
