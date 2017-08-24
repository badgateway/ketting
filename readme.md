Ketting - A hypermedia client for javascript
============================================

Introduction
------------

The Ketting library is an attempt at creating a 'generic' hypermedia client, it
supports an opinionated set of modern features REST services might have.

The library supports [HAL][2], [Web Linking (HTTP Link Header)][1] and HTML5
links. It uses the Fetch API and is meant for client and server-side
javascript.

### Example

```js
var ketting = new Ketting('https://api.example.org/');

// Follow a link with rel="author". This could be a HTML5 `<link>`, a
// HAL `_links` or a HTTP `Link:`.
var author = await ketting.follow('author');

// Grab the current state
var authorState = await author.get();

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
hypermedia / HATEAOS servers. It currently parses [HAL][2] and has a deep
understanding of inks and embedded resources. There's also support for parsing
and following links from HTML documents, and it understands the HTTP `Link:`
header.

Using this library it becomes very easy to follow links from a single bookmark,
and discover resources and features on the server.

### Following links

One core tennet of building a good REST service, is that URIs should be
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

This is how that iteraction might look like:

```js
var ketting = new Ketting('https://api.example.org/');
var createArticle = await ketting.follow('articleCollection').follow('new'); // chained follow

var newArticle = await createArticle.post({title: 'Hello world'});
var author = await newArticle.follow('author');

// Output author information
console.log(await author.get());
```

### Embedded resources

Embedded resources are a HAL feature. In situations when you are modelling a
'collection' of resources, in HAL you should generally just create links to
all the items in the collection. However, if a client wants to fetch all these
items, this can result in a lot of HTTP requests. HAL uses `_embedded` to work
around this. Using `_embedded` a user can effectively tell the HAL client about
the links in the collection and immediately send along the contents of those
resources, thus avoiding the overhead.

Ketting understands `_embedded` and completely abstracts them away. If you use
ketting with a HAL server, you can therefore completely ignore them.

For example, given a collection resource with many resources that hal the
relationshiptype `item`, you might use the following API:

```js
var ketting = new Ketting('https://api.example.org/');
var articleCollection = await ketting.follow('articleCollection');

var items = await someCollection.followAll('item');

for (i in items) {
   console.log(await items[i].get());
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

### HAL and Curies

HAL has a CURIES feature. If your api uses them, the Ketting library will
automatically expand them.

For example, from a Ketting perspective, the following HAL document:

```js
{
  "_links" : {
    "foo:website" : {
      "href": "https://github.com/evert/ketting/",
    },
    "curies" : {
      "href": "http://ns.example.org/{rel}",
      "templated": true,
      "name": "foo",
    }
  }
}
```

Is parsed like this:

```js
{
  "_links" : {
    "http://ns.example.org/website" : {
      "href": "https://github.com/evert/ketting/",
    }
  }
}
```

Only the full relation type (`http://ns.example.org/website`) can be used in
functions such as `follow` and `followAll`.


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
var options = {}; // options are optional
var ketting = new Ketting('https://api.example.org/', options);
```

Currently the only supported option is `auth`. `auth` can be used to specify
authentication information. HTTP Basic auth and OAUth2 Bearer token are
supported.

Basic example:

```js
var options = {
  auth: {
    type: 'basic',
    userName: 'foo',
    password: 'bar'
  }
};
```

Bearer example:

```js
var options = {
  auth: {
    type: 'bearer',
    token: 'bar'
  }
};
```


#### `Ketting.getResource()`

Return a 'resource' object, based on it's url. If the url is not supplied,
a resource will be returned pointing to the bookmark.

If a relative url is given, it will be resolved based on the bookmark uri.

```js
var resource = client.getResource('http://example.org'); // absolute uri
var resource = client.getResource('/foo'); // relative uri
var resource = client.getResource(); // bookmark
```

The resource is returned immediately, and not as a promise.

#### `Ketting.follow()`

The `follow` function on the `Ketting` follows a link based on it's relation
type from the bookmark resource.

```js
var someResource = await ketting.follow('author');
```

This is just a shortcut to:

```js
var someResource = await ketting.getResource().follow('author');
```

#### `Ketting.fetch`

The `fetch` function is a wrapper for the new [Fetch][3] web standard. This
function takes the same arguments (`input` and `init`), but it decorates the
HTTP request with Authentication headers.

```js
var response = await ketting.fetch('https://example.org');
```

### Resource

The `Resource` class is the most important object, and represents a REST
resource. Functions such `follow` and `getResource` always return `Resource`
objects.

#### `Resource.get()`

Returns the result of a `GET` request. This function returns a `Promise`.

```js
await resource.get();
```

If the resource was fetched earlier, it will return a cached copy.

#### `Resource.put()`

Updates the resource with a new representation

```js
await resource.put({ 'foo' : 'bar' });
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
var newResource = await parentResource.post({ foo: 'bar' });
// Output a list of links on the newly created resource
console.log(await newResource.links());
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
});
```

You can also request only the links for a relation-type you are interested in:

```js
resource.links('author'); // Get links with rel=author
```


#### `Resource.follow()`

Follows a link, by it's relation-type and returns a new resource for the
target.

```js
var author = await resource.follow('author');
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

    { href: "/foo{?a}", templated: true}

May be followed using

```js
resource
  .follow('some-templated-link', { a: 'bar'})
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
var init = {
  method: 'PATCH',
  body: JSON.serialize(['some', 'patch, 'object'])
};
var response = await resource.fetch(init);
console.log(response.statusCode);
```

#### `resource.fetchAndThrow()`

This function is identical to `fetch`, except that it will throw a (async)
exception if the server responsed with a HTTP error.

### Link

The link class represents any Link of any type of document. It has the
following properties:

* rel - relation type
* href - The uri
* baseHref - the uri of the parent document. Used for resolving relative uris.
* type - A mimetype, if specified
* templated - If it's a URI Template. Most of the time this is false.
* title - Hunman readable label for the uri
* name - Unique identifier for the link within the document (rarely used).

#### `Link.resolve()`

Returns the absolute uri to the link. For example:

```js
var link = new Link({href: '/foo', baseHref: "http://example.org/bar" });

console.log(link.resolve());
// output is http://example.org/foo
```

#### `Link.expand()`

Expands a templated link. Example:

```js
var link = new Link({href: 'http://example.org/foo{?q}', templated: true});

console.log(link.expand({q: 'bla bla'});
// output is http://example.org/foo?q=bla+bla
```

[1]: https://tools.ietf.org/html/rfc5988 "Web Linking"
[2]: http://stateless.co/hal_specification.html "HAL - Hypertext Application Language"
[6]: https://tools.ietf.org/html/rfc7240 "Prefer Header for HTTP"
[3]: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
