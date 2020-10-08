![Logo](logo_badge_ketting.png) Ketting - A hypermedia client for javascript
============================================================================

* Go to the [Wiki][9] for full documentation.

Introduction
------------

The Ketting library is a generic REST client with Hypermedia features.

The library will work with any JSON-based HTTP API, but it gets superpowers
when using it with formats that have support for links, including:

* [HAL][hal]
* [JSON:API][jsonapi]
* [Siren][siren],
* [Collection+JSON][coljson]

And it even works with HTML links, and [HTTP Link Headers][1].

Ketting is designed to both work in the browser and in Node.js. Additionally,
it has [react bindings][ketting-react] that will make it work in a way that's
familiar to Apollo-Client users.

### Example

```typescript
const ketting = new Ketting('https://api.example.org/');

// Follow a link with rel="author". This could be a HTML5 `<link>`, a
// HAL `_links` or a HTTP `Link:`.
const author = await ketting.follow('author');

// Grab the current state
const authorState = await author.get();

// Change the firstName property of the object. Note that this assumes JSON.
authorState.data.firstName = 'Evert';

// Save the new state
await author.put(authorState);
```

Docs
----

* [Installation][7]
* [Full documentation][9]
* [Authentication][2]


Notable Features
----------------

Ketting is a library that sits on top of [Fetch API][3] to provide a RESTful
interface and make it easier to follow REST best practices more strictly.

It provides some useful abstractions that make it easier to work with true
hypermedia / HATEOAS servers. It currently parses many hypermedia formats
and has a deep understanding of links and embedded resources. There's also
support for parsing and following links from HTML documents, and it
understands the HTTP `Link:` header.

It also has support for 'fetch middlewares', which is used to implement
OAuth2 support, but also opens the door to development of other plugins.

Using this library it becomes very easy to follow links from a single bookmark,
and discover resources and features on the server.

Supported formats:

* [HAL][hal]
* [Siren][siren] - Including support for actions.
* HTML - Can automatically follow `<link>` and `<a>` element with `rel=`
  attributes, and submit HTML `<form>`s.
* [HTTP Link header][1] - automatically registers as links regardless of format.
* [JSON:API][jsonapi] - Understands the `links` object and registers collection
  members as `item` relationships.
* [application/problem+json][problem] - Will extract useful information from
  the standard problem object and embed them in exception objects.

Other features:

* [Prefer-Push][prefer-push]
* [Prefer-Transclude][prefer-transclude]
* It can submit HTML forms and Siren actions.

Read further on the [Wiki][9]


[1]: https://tools.ietf.org/html/rfc8288 "Web Linking"
[2]: https://github.com/evert/ketting/wiki/Authentication
[3]: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API

[7]: https://github.com/evert/ketting/wiki/Installation
[8]: https://github.com/evert/ketting/wiki/Getting-Started
[9]: https://github.com/evert/ketting/wiki/

[hal]: http://stateless.co/hal_specification.html "HAL - Hypertext Application Language"
[jsonapi]: https://jsonapi.org/
[problem]: https://tools.ietf.org/html/rfc7807
[siren]: https://github.com/kevinswiber/siren "Structured Interface for Representing Entities"
[coljson]: http://amundsen.com/media-types/collection/format/
[prefer-push]: https://tools.ietf.org/html/draft-pot-prefer-push
[prefer-transclude]: https://github.com/inadarei/draft-prefer-transclude/blob/master/draft.md
[react-ketting]: https://github.com/badgateway/react-ketting
