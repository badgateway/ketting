Deprecation warnings
====================

If your API has deprecated endpoints or links, Ketting logs a warning with
`console.warn()`, so developers notice they still rely on them.

Deprecated resources
--------------------

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

Deprecated links
----------------

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

[deprecation]: https://www.rfc-editor.org/rfc/rfc9745
[sunset]: https://www.rfc-editor.org/rfc/rfc8594
[link-hint]: https://datatracker.ietf.org/doc/html/draft-nottingham-link-hint
