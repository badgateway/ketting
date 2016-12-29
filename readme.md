Restle - A hypermedia client for nodejs
=======================================

**Important note: this package is currently pretty experimental and not
complete. Use at your own risk.**


Introduction
------------

This NPM package is an attempt at creating a 'generic' hypermedia client, that
supports an opiniated set of modern features from REST services.

This means that there's a strong focus on links and link-relationships.
Initially we'll build in strong support for [Web Linking][1], a.k.a. the HTTP
`Link` header, and [HAL][2].


Installation
------------

   npm install --save restle


Goals
-----

### For 1.0:

* `PUT` request.
* `DELETE` request.
* Global resource cache.
* Figuring out `_embedded`.
* Support HTTP `Link` header.
* Support non-JSON resources, including things like images.
* Parse [HTML5 links][1].
* Parse [Atom][5].

### Post 1.0

* Support for [HAL Forms][4].
* Parse and respect HTTP Cache headers.
* Support [`Prefer: return=representation`][6].

### Already done:

* Following links.
* Basic HAL parsing.

Usage
-----

### Fetching a resource and following a link:

```js
var restle = require('restle')('http://my-hal-api.example.org/');

// Fetch the home resource
var home = restle.getResource()
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

### Providing custom options

restle uses [request][3] under the hood to do HTTP requests. Custom options
can be specified as such:

```js
var bookMark = 'https://my-hal-api.example.org';
var options {
  auth: {
    user: 'foo',
    pass: 'bar'
  }
}

var restle = require('restle')(bookMark, options);
```

For a full list of possible options, check out the [request][3] documentation.

API
---

### Client

#### Constructor

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

### `Resource.refresh()`

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

### `Resource.links()`

Returns a list of `Link` objects for the resource.

```js
resource.links().then(function(links) {
  console.log(links);
});
```

### `Resource.follow()`

Follows a link, by it's relation-type and returns a new resource for the
target.

```js
resource.follow('author').then(function(author) {
  return author.get();
}).then(function(body) {
  console.log(body);
});
```


[1]: https://tools.ietf.org/html/rfc5988 "Web Linking"
[2]: http://stateless.co/hal_specification.html "HAL - Hypertext Application Language"
[3]: https://www.npmjs.com/package/request
[4]: https://rwcbook.github.io/hal-forms/ "HAL Forms"
[5]: https://bitworking.org/projects/atom/rfc5023.html "AtomPub"
[6]: https://tools.ietf.org/html/rfc7240 "Prefer Header for HTTP"
