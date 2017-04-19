Restl - A hypermedia client for nodejs
======================================

**Important note: this package is currently pretty experimental and not
complete. Use at your own risk.**


Introduction
------------

This NPM package is an attempt at creating a 'generic' hypermedia client, it
supports an opinionated set of modern features REST services might have.

This means that there's a strong focus on links and link-relationships.
Initially we'll build in strong support for [Web Linking][1], a.k.a. the HTTP
`Link` header, and [HAL][2].


Installation
------------

   npm install --save restl


Features overview
-----------------

Restl is a library that sits on top of a HTTP client (currently Request, but
soon the Fetch API).

It provides some useful abstractions that make it easier to work with true
hypermedia / HATEAOS servers. It currently parses [HAL][2] and has a deep
understanding of links and embedded resources.

Using this library it becomes very easy to follow links from a single bookmark,
and discover resources and features on the server. Embedded resources are
completely hidden. Embedded resources just show up as links, but when you're
asking for the representation, the response to the `GET` request will be
served from a cache.

This feature allows HAL servers to upgrade links to embedded resources, and
allows any client to transparently take advantage of this change and issue
less HTTP requests.


Goals
-----

### For 1.0:

* Expand CURIES automatically.
* Support HTTP `Link` header.
* Support non-JSON resources, including things like images.
* Parse [HTML5 links][1].
* Built-in OAuth2.
* Browser support (nodejs only at the moment, but only because of the Request
  library.)


### Post 1.0

* Support for [HAL Forms][4].
* Parse and respect HTTP Cache headers.
* Support [`Prefer: return=representation`][6].

### Maybe later

* Parse [Atom][5].
* Support [Siren][7]


Usage
-----

### Fetching a resource and following a link:

```js
var restl = require('restl')('http://my-hal-api.example.org/');

// Fetch the home resource
var home = restl.getResource()
// Then get the 'author' relationship from _links
home.follow('author')
  .then(function(authorResource)) {

    // Follow the 'me' resource.
    return authorResource.follow('me');

  }.then(function(meResource) {

    // Get the full body
    return meResource.get();

  }.then(function(meBody) {

    // Output the body
    console.log(meBody);

  }).catch(function(err) {

    // Error
    console.log(err);

  });
```

### Following a chain of links

It's possible to follow a chain of links with follow:

```js
client.follow('rel1')
  .then(function(resource1) {
    return resource1.follow('rel2');
  })
  .then(function(resource2) {
    return resource2.follow('rel3');
  })
  .then(function(resource3) {
    console.log(resource3.getLinks());
  });
```

As you can see, `follow()` returns a Promise. However, the returned promise
has an additional `follow()` function itself, which makes it possible to
shorten this to:

```js
client
  .follow('rel1')
  .follow('rel2')
  .follow('rel3')
  .then(function(resource3) {
    console.log(resource3.getLinks());
  });
```

### Providing custom options

restl uses [request][3] under the hood to do HTTP requests. Custom options
can be specified as such:

```js
var bookMark = 'https://my-hal-api.example.org';
var options {
  auth: {
    user: 'foo',
    pass: 'bar'
  }
}

var restl = require('restl')(bookMark, options);
```

For a full list of possible options, check out the [request][3] documentation.

API
---

### Client

```js
var client = new Client(bookMark, options);
```

* `bookMark` - The base URL of the web service.
* `options` _optional_ - A list of options for [Request][3].

#### `Client.getResource()`

Returns a 'Resource' object based on the url. If

```js
var resource = client.getResource(url);
```

* `url` - URL to fetch. Might be relative. If not provided, the bookMark is
  fetched instead.

This function returns a `Resource`.


### Resource

#### `Resource.get()`

Returns the result of a `GET` request. This function returns a `Promise`.

```js
resource.get().then(function(body) {
  console.log(body);
});
```

If the resource was fetched earlier, it will return a cached copy.


#### `Resource.put()`

Updates the resource with a new representation

```js
resource.put({ 'foo' : 'bar' });
```

This function returns a Promise that resolves to `null`.

#### `Resource.delete()`

Deletes the resource.

```js
resource.delete();
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
resource.post({ property: 'value'})
  .then(function(newResource) {
    return newResource.links();
  })
  .then(function(links) {
    console.log(links);
  });
```

#### `Resource.refresh()`

Refreshes the internal cache for a resource and does a `GET` request again.
This function returns a `Promise` that resolves when the operation is complete,
but the `Promise` does not have a value.

```js
resource.refresh().then(function() {
  return resource.get()
}).then(function(body) {
  // A fresh body!
});
```

#### `Resource.links()`

Returns a list of `Link` objects for the resource.

```js
resource.links().then(function(links) {
  console.log(links);
});
```

You can also request only the links for a relation-type you are interested in:

```js
resource.links('item').then(function(links) {

});
```


#### `Resource.follow()`

Follows a link, by it's relation-type and returns a new resource for the
target.

```js
resource.follow('author').then(function(author) {
  return author.get();
}).then(function(body) {
  console.log(body);
});
```

The follow function returns a special kind of Promise that has a `follow()`
function itself.

This makes it possible to chain follows:

```js
resource
  .follow('author')
  .follow('homepage')
  .follow('icon');
```

#### `Resource.followAll()`

This method works like `follow()` but resolves into a list of resources.
Multiple links with the same relation type can appear in resources; for
example in collections.

```js
resource.followAll('item')
  .then(function(items) {
    console.log(items);
  });
```

#### `Resource.representation()`

This function is similar to `GET`, but instead of just returning a response
body, it returns a `Representation` object.

### `Representation`

The Representation is typically the 'body' of a resource in REST terminology.
It's the R in REST.

The Representation is what gets sent by a HTTP server in response to a `GET`
request, and it's what gets sent by a HTTP client in a `POST` request.

The Representation provides access to the body, a list of links and HTTP
headers that represent real meta-data of the resource. Currently this is only
`Content-Type` but this might be extended to include encoding, language and
cache-related information.


#### `Representation.body`

The `body` property has the body contents of a `PUT` request or a `GET` response.

#### `Representation.links`

The `links` property has the list of links for a resource.

#### `Representation.contentType`

The `contentType` property has the value of the `Content-Type` header for both
requests and responses.


[1]: https://tools.ietf.org/html/rfc5988 "Web Linking"
[2]: http://stateless.co/hal_specification.html "HAL - Hypertext Application Language"
[3]: https://www.npmjs.com/package/request
[4]: https://rwcbook.github.io/hal-forms/ "HAL Forms"
[5]: https://bitworking.org/projects/atom/rfc5023.html "AtomPub"
[6]: https://tools.ietf.org/html/rfc7240 "Prefer Header for HTTP"
[7]: https://github.com/kevinswiber/siren "Siren Hypermedia format"
