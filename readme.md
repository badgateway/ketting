Ketting - A hypermedia client for javascript
============================================

[![Greenkeeper badge](https://badges.greenkeeper.io/evert/ketting.svg)](https://greenkeeper.io/)

Introduction
------------

The Ketting library is an attempt at creating a 'generic' hypermedia client, it
supports an opinionated set of modern features REST services might have.

The library supports [HAL][hal], [Web Linking (HTTP Link Header)][1] and HTML5
links. It uses the Fetch API and works both in the browsers and in node.js.

### Example

```js
const ketting = new Ketting('https://api.example.org/');

// Follow a link with rel="author". This could be a HTML5 `<link>`, a
// HAL `_links` or a HTTP `Link:`.
const author = await ketting.follow('author');

// Grab the current state
const authorState = await author.get();

// Change the firstName property of the object. Note that this assumes JSON.
authorState.firstName = 'Evert';

// Save the new state
await author.put(authorState);
```

Installation
------------

    npm install ketting

or:

    yarn add ketting


Features overview
-----------------

Ketting is a library that sits on top of a [Fetch API][3] to provide a RESTful
interface and make it easier to follow REST best practices more strictly.

It provides some useful abstractions that make it easier to work with true
hypermedia / HATEAOS servers. It currently parses [HAL][hal] and has a deep
understanding of links and embedded resources. There's also support for parsing
and following links from HTML documents, and it understands the HTTP `Link:`
header.

Using this library it becomes very easy to follow links from a single bookmark,
and discover resources and features on the server.

Supported formats:

* [HAL][hal]
* HTML - Can automatically follow `<link>` and `<a>` element with `rel=`
  attributes.
* [HTTP Link header][1] - automatically registers as links regardless of format.
* [JSON:API][jsonapi] - Understands the `links` object and registers collection
  members as `item` relationships.
* [application/problem+json][problem] - Will extract useful information from
  the standard problem object and embed them in exception objects.


### Following links

One core tenet of building a good REST service, is that URIs should be
discovered, not hardcoded in an application. It's for this reason that the
emphasis in this library is _not_ on URIs (like most libraries) but on
relation-types (the `rel`) and links.

Generally when interacting with a REST service, you'll want to only hardcode
a single URI (a bookmark) and discover all the other APIs from there on on.

For example, consider that there is a some API at `https://api.example.org/`.
This API has a link to an API for news articles (`rel="articleCollection"`),
which has a link for creating a new article (`rel="new"`). When `POST`ing on
that uri, the api returns `201 Created` along with a `Location` header pointing
to the new article. On this location, a new `rel="author"` appears
automatically, pointing to the person that created the article.

This is how that interaction might look like:

```js
const ketting = new Ketting('https://api.example.org/');
const createArticle = await ketting.follow('articleCollection').follow('new'); // chained follow

const newArticle = await createArticle.post({ title: 'Hello world' });
const author = await newArticle.follow('author');

// Output author information
console.log(await author.get());
```

### Embedded resources

Embedded resources are a HAL feature. In situations when you are modeling a
'collection' of resources, in HAL you should generally just create links to
all the items in the collection. However, if a client wants to fetch all these
items, this can result in a lot of HTTP requests. HAL uses `_embedded` to work
around this. Using `_embedded` a user can effectively tell the HAL client about
the links in the collection and immediately send along the contents of those
resources, thus avoiding the overhead.

Ketting understands `_embedded` and completely abstracts them away. If you use
Ketting with a HAL server, you can therefore completely ignore them.

For example, given a collection resource with many resources that hal the
relationshiptype `item`, you might use the following API:

```js
const ketting = new Ketting('https://api.example.org/');
const articleCollection = await ketting.follow('articleCollection');

const items = await someCollection.followAll('item');

for (const item of items) {
   console.log(await item.get());
}
```

Given the last example, if the server did _not_ use embedding, it will result
in a HTTP GET request for every item in the collection.

If the server _did_ use embedding, there will only be 1 GET request.

A major advantage of this, is that it allows a server to be upgradable. Hot
paths might be optimized using embedding, and the client seamlessly adjusts
to the new information.

Further reading:

* [Further reading](https://evertpot.com/rest-embedding-hal-http2/).
* [Hypertext Cache Pattern in HAL spec](https://tools.ietf.org/html/draft-kelly-json-hal-08#section-8.3).


Automatically parsing problem+json
----------------------------------

If your server emits application/problem+json documents ([RFC7807][problem])
on HTTP errors, the library will automatically extract the information from
that object, and also provide a better exception message (if the title
property is provided).


Node and Browser
----------------

Ketting works on any stable node.js version and modern browsers. To run Ketting
in a browser, the following must be supported by a browser:

* The [Fetch API][3].
* Promises (async/await is not required)


API
---

### `Ketting`

The 'Ketting' class is the main class you'll use to access anything else.

#### Constructor

```js
const options = {}; // options are optional
const ketting = new Ketting('https://api.example.org/', options);
```

3 keys or `options` are currently supported:

* `auth`
* `fetchInit`.
* `match`

`auth` can be used to specify authentication information. Supported
authentication methods are:

* HTTP Basic auth.
* OAuth2 flows:
  * `password` grant.
  * `client_credentials` grant.
  * `authorization_code` grant.

For details about setting up authentication, check out the [Authentication][2]
page on the wiki.

The `fetchInit` option is a default list of settings that's automatically
passed to `fetch()`. This is especially useful in a browser, where there's a
few more settings highly relevant to the security sandbox.

For example, to ensure that the browser automatically passed relevant cookies
to the endpoint, you would specify this as such:

```js
const options = {
  fetchInit : {
    credentials: 'include'
  }
};
```

See the documentation for the [Request constructor](https://developer.mozilla.org/en-US/docs/Web/API/Request/Request)
for the full list.

Lastly, the `match` property can be used to specify `fetchInit` and `auth`
again, but only have the settings apply to specific domains.

For example, the following sets basic authentication, but only for domains
matching `*.example.org`:

```js
const options = {
  match: {
    '*.example.org': {
      auth: {
        type: 'basic',
        userName: 'foo',
        password: 'bar'
      }
    }
  }
}
```

This is very important if your API is designed to refer to external resources,
and you're using Ketting to fetch their representations.


#### `Ketting.getResource()`

Return a 'resource' object, based on it's url. If the url is not supplied,
a resource will be returned pointing to the bookmark.

If a relative url is given, it will be resolved based on the bookmark uri.

```js
const resource = client.getResource('http://example.org'); // absolute uri
const resource = client.getResource('/foo'); // relative uri
const resource = client.getResource(); // bookmark
```

The resource is returned immediately, and not as a promise.

#### `Ketting.follow()`

The `follow` function on the `Ketting` follows a link based on it's relation
type from the bookmark resource.

```js
const someResource = await ketting.follow('author');
```

This is just a shortcut to:

```js
const someResource = await ketting.getResource().follow('author');
```

#### `Ketting.fetch`

The `fetch` function is a wrapper for the new [Fetch][3] web standard. This
function takes the same arguments (`input` and `init`), but it decorates the
HTTP request with Authentication headers.

```js
const response = await ketting.fetch('https://example.org');
```

### Resource

The `Resource` class is the most important object, and represents a REST
resource. Functions such `follow` and `getResource` always return `Resource`
objects.

#### `Resource.uri`

Returns the current uri of the resource. This is a property, not a function
and is always available.

#### `Resource.contentType`

A property representing the `Content-Type` of the resource. This value will
be used in `GET` requests (with the `Accept` header) and `PUT` requests (with
the `Content-Type` header).

The `contentType` might be available immediately if the current resource was
followed from a link that had "type" information. If it's not available, it
might be determined later, after the first `GET` request is done.

#### `Resource.get()`

Returns the result of a `GET` request. This function returns a `Promise`.

```js
await resource.get();
```

If the resource was fetched earlier, it will return a cached copy.

#### `Resource.put()`

Updates the resource with a new representation

```js
await resource.put({ foo: 'bar' });
```


#### `Resource.delete()`

Deletes the resource.

```js
await resource.delete();
````

This function returns a Promise that resolves to `null`.

#### `Resource.post()`

This function is meant to be an easy way to create new resources. It's not
necessarily for any type of `POST` request, but it is really meant as a
convenience method APIs that follow the typical pattern of using `POST` for
creation.

If the HTTP response from the server was successful and contained a `Location`
header, this method will resolve into a new Resource. For example, this might
create a new resource and then get a list of links after creation:

```js
const newResource = await parentResource.post({ foo: 'bar' });
// Output a list of links on the newly created resource
console.log(await newResource.links());
```

#### `Resource.patch()`

This function provides a really simply implementation of the `PATCH` method.
All it does is encode the body to JSON and set the `Content-Type` to
`application/json`. I'm curious to hear use-cases for this, so open a ticket
if this doesn't cut it!

```js
await resource.patch({
  foo: 'bar'
});
```

#### `Resource.refresh()`

The `refresh` function behaves the same as the `get()` function, but it ignores
the cache. It's equivalent to a user hitting the "refresh" button in a browser.

This function is useful to ditching the cache of a specific resource if the
server state has changed.

```js
console.log(await resource.refresh());
```

#### `Resource.links()`

Returns a list of `Link` objects for the resource.

```js
console.log(await resource.links());
```

You can also request only the links for a relation-type you are interested in:

```js
resource.links('author'); // Get links with rel=author
```


#### `Resource.follow()`

Follows a link, by it's relation-type and returns a new resource for the
target.

```js
const author = await resource.follow('author');
console.log(await author.get());
```

The `follow` function returns a special kind of Promise that has a `follow()`
function itself.

This makes it possible to chain follows:

```js
resource
  .follow('author')
  .follow('homepage')
  .follow('icon');
```

Lastly, it's possible to follow [RFC6570](https://tools.ietf.org/html/rfc6570)
templated links (templated URI), using the second argument.

For example, a link specified as:

    { href: "/foo{?a}", templated: true }

May be followed using

```js
resource
  .follow('some-templated-link', { a: 'bar' })
```

This would result following a link to the `/foo?a=bar` uri.


#### `Resource.followAll()`

This method works like `follow()` but resolves into a list of resources.
Multiple links with the same relation type can appear in resources; for
example in collections.

```js
var items = await resource.followAll('item');
console.log(items);
```

#### `resource.fetch()`

The `fetch` function is a wrapper for the `Fetch API`. It takes very similar
arguments to the regular fetch, but it does a few things special:

1. The uri can be omitted completely. If it's omitted, the uri of the
   resource is used.
2. If a uri is supplied and it's relative, it will be resolved with the
   uri of the resource.

For example, this is how you might do a HTTP `PATCH` request:

```js
const init = {
  method: 'PATCH',
  body: JSON.serialize(['some', 'patch', 'object'])
};
const response = await resource.fetch(init);
console.log(response.statusCode);
```

#### `resource.fetchAndThrow()`

This function is identical to `fetch`, except that it will throw a (async)
exception if the server responded with a HTTP error.

#### `resource.go(uri: string)`

This function returns a new Resource object, based on a relative uri.
This is useful in case no link is available on the resource to follow.

```js
const subResource = resource.go('?page=2');
```

It doesn't do any HTTP requests.

### Link

The link class represents any Link of any type of document. It has the
following properties:

* rel - relation type
* href - The uri
* baseHref - the uri of the parent document. Used for resolving relative uris.
* type - A mimetype, if specified
* templated - If it's a URI Template. Most of the time this is false.
* title - Human readable label for the uri
* name - Unique identifier for the link within the document (rarely used).

#### `Link.resolve()`

Returns the absolute uri to the link. For example:

```js
const link = new Link({ href: '/foo', baseHref: "http://example.org/bar" });

console.log(link.resolve());
// output is http://example.org/foo
```

#### `Link.expand()`

Expands a templated link. Example:

```js
const link = new Link({ href: 'http://example.org/foo{?q}', templated: true });

console.log(link.expand({ q: 'bla bla' });
// output is http://example.org/foo?q=bla+bla
```

### OAuth2 Managed Client

The underlying OAuth2 client is implemented using [js-client-oauth2][5] is
exposed via the 'Ketting' class.

```js
const ketting = new Ketting('https://api.example.org/', {
  auth: {
    type: 'oauth2',
    client: {
      clientId: 'fooClient',
      clientSecret: 'barSecret',
      accessTokenUri: 'https://api.example.org/oauth/token',
      scopes: ['test']
    },
    owner: {
      userName: 'fooOwner',
      password: 'barPassword'
    }
  }
});

const oAuthClient = ketting.oauth2Helper.client;
// Interact with the underlying OAuth2 client
```

[1]: https://tools.ietf.org/html/rfc8288 "Web Linking"
[2]: https://github.com/evert/ketting/wiki/Authentication
[3]: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API

[5]: https://github.com/mulesoft/js-client-oauth2
[6]: https://tools.ietf.org/html/rfc7240 "Prefer Header for HTTP"

[hal]: http://stateless.co/hal_specification.html "HAL - Hypertext Application Language"
[jsonapi]: https://jsonapi.org/
[problem]: https://tools.ietf.org/html/rfc7807
