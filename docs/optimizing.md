Optimizing many requests
========================

*This page builds on the concepts from [Hypermedia](hypermedia.md).*

Well-designed hypermedia APIs have many small resources, each with its own
URI. Take this article collection:

```json
{
  "_links": {
    "self": { "href": "/articles" },
    "item": [
      { "href": "/articles/1" },
      { "href": "/articles/2" },
      { "href": "/articles/3" }
    ]
  }
}
```

Printing every article naively looks like this:

```typescript
const articleResources = await articleCollection.followAll('item');

for (const resource of articleResources) {
  const state = await resource.get();
  console.log(state.data);
}
```

With an empty cache, this does one `GET` request per article, one after the
other. Here are the ways to make it faster.

Parallelize
-----------

Fetch all states at once:

```typescript
const articleStates = await articleCollection.followAll('item').get();

for (const state of articleStates) {
  console.log(state.data);
}
```

`get()` on the result of `followAll()` fires all requests in parallel. This
helps with HTTP/1.1, and a lot with HTTP/2, which multiplexes all requests
over one connection.

Prefetch
--------

`preFetch()` starts fetching the followed resources in the background, while
your code keeps processing them one by one:

```typescript
const articleResources = await articleCollection
  .followAll('item')
  .preFetch();

for (const resource of articleResources) {
  // The request is already in flight, or done.
  const state = await resource.get();
  console.log(state.data);
}
```

Identical requests that are in flight at the same time are de-duplicated, and
resources that are already cached are not fetched again. `preFetch()` works on
`follow()` too.

Embedding resources
-------------------

Embedding (also called compound documents or transclusion) lets one response
carry the state of other resources. HAL does this with `_embedded`, Siren with
sub-entities:

```json
{
  "_links": {
    "self": { "href": "/articles" },
    "item": [
      { "href": "/articles/1" },
      { "href": "/articles/2" }
    ]
  },
  "_embedded": {
    "item": [
      {
        "_links": { "self": { "href": "/articles/1" } },
        "title": "Welcome to my blog!"
      },
      {
        "_links": { "self": { "href": "/articles/2" } },
        "title": "Second post!"
      }
    ]
  }
}
```

Ketting caches every embedded resource under its `self` URI, so the loop at the
top of this page does no further request. Embedded HAL items without a `self`
link are ignored, with a warning. Embedded HAL resources are also exposed as links
with their relation, so `followAll('item')` finds them even if `_links` does
not list them.

The advantage of embedding is that the server controls it. When a path turns
out to be slow, the server can start embedding the related resources, and
clients benefit without any change.

Asking the server to embed
--------------------------

`preferTransclude()` sends a [`Prefer: transclude`][prefer-transclude] header
with the relation being followed, asking the server to embed those resources:

```typescript
const articleResources = await articleCollection
  .followAll('item')
  .preferTransclude();
```

```http
GET /articles HTTP/1.1
Prefer: transclude=item
```

Servers that do not support it ignore the header.

Using HEAD requests
-------------------

If your server puts its links in `Link` headers, `useHead()` makes `follow()`
and `followAll()` find them with a `HEAD` request instead of a `GET`:

```typescript
const author = await articleResource
  .follow('author')
  .useHead();
```

Further reading
---------------

* [Performance testing HTTP/1.1 vs HTTP/2 vs HTTP/2 + Server Push for REST
  APIs][h2-parallelism] - Evert Pot
* [Let's Stop Building APIs Around a Network Hack][network-hack] - Phil
  Sturgeon

[prefer-transclude]: https://github.com/inadarei/draft-prefer-transclude/blob/master/draft.md
[h2-parallelism]: https://evertpot.com/h2-parallelism/
[network-hack]: https://apisyouwonthate.com/blog/lets-stop-building-apis-around-a-network-hack
