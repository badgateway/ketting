Hypermedia
==========

*This page builds on the concepts from [Getting started](getting-started.md).*

If your REST API uses hypermedia, Ketting lets you navigate it by following
links, instead of building URIs yourself.

Supported formats
-----------------

Ketting picks up links from the [HTTP `Link` header][weblinking] of any
response, and from the body of the following formats:

| Format | Content type | Links | Embedded resources | Actions |
| --- | --- | --- | --- | --- |
| [HAL][hal] | `application/hal+json` | `_links` | `_embedded` | [HAL Forms][hal-forms] `_templates` |
| [HAL Forms][hal-forms] | `application/prs.hal-forms+json` | `_links` | `_embedded` | `_templates` |
| [Siren][siren] | `application/vnd.siren+json` | `links`, sub-entities | sub-entities | `actions` |
| [JSON:API][jsonapi] | `application/vnd.api+json` | `links` | | |
| [Collection+JSON][cj] | `application/vnd.collection+json` | `links`, `items`, `queries` | | |
| HTML | `text/html` | [`<a>`][html-a] and [`<link>`][html-link] with `rel` and `href` | | `<form>` |

Plain `application/json` responses, and any `application/*+json` type that is
not listed above, are parsed as HAL. Links of a JSON:API collection's
resource objects are exposed with the `item` relation.

Ketting sends an `Accept` header that lists all of these types. See
[Content types](api.md#content-types) to change it.

Following a link
----------------

Say our API has articles, and articles have an author. With HAL, the server
might return:

```json
{
  "_links": {
    "self": { "href": "/article/1" },
    "author": { "href": "/authors/123", "title": "Dr. Pidgin" }
  },
  "title": "Hello world!",
  "body": "..."
}
```

To get to the author, follow the link by its relation type ("rel"):

```typescript
import { Client } from 'ketting';

const client = new Client('https://api.example/');
const articleResource = client.go('/article/1');

const authorResource = await articleResource.follow('author');
```

`authorResource` is a `Resource` for `https://api.example/authors/123`.
`follow()` fetched the article to find the link; the author itself is not
fetched until you call `get()` on it.

If there is no link with that relation, `follow()` rejects with a
`LinkNotFound` error.

Optional links
--------------

When a link may legitimately be absent, use `mayFollow()`. It works like
`follow()`, but gives `undefined` instead of an error:

```typescript
const state = await articleResource.get();
const editResource = state.mayFollow('edit');
if (editResource) {
  // The user may edit this article.
}

// Or in one line:
const authorState = await state.mayFollow('author')?.get();
```

`client.mayFollow()` does the same from the bookmark resource.

Following many links
--------------------

Our API has a home document that links to an article collection, which lists
every article as an `item` link:

```json
{
  "_links": {
    "self": { "href": "/" },
    "article-collection": { "href": "/articles", "title": "List of articles" },
    "author-collection": { "href": "/authors", "title": "List of authors" }
  },
  "motd": "Welcome to the blogging server!"
}
```

```json
{
  "_links": {
    "self": { "href": "/articles" },
    "item": [
      { "href": "/articles/1" },
      { "href": "/articles/2" },
      { "href": "/articles/3" }
    ],
    "next": { "href": "/articles?page=2" }
  },
  "total": 25
}
```

`followAll()` returns every resource with a given relation. If there are
none, the array is empty.

```typescript
const client = new Client('https://api.example/');

// Without an argument, go() returns the bookmark resource.
const home = client.go();

const articleCollection = await home.follow('article-collection');
const articleResources = await articleCollection.followAll('item');

for (const resource of articleResources) {
  const state = await resource.get();
  console.log(state.data);
}
```

Doing many `GET` requests in sequence can be slow. See
[Optimizing many requests](optimizing.md) for ways to speed this up.

Chaining
--------

`follow()` and `followAll()` return a promise-like object that can be
chained, to do several hops at once:

```typescript
const authorResource = await client.go()
  .follow('article-collection')
  .follow('item') // If there is more than one, the first one is used.
  .follow('author');
```

`client.follow()` is a shortcut for `client.go().follow()`.

You can also end a chain with `get()`, to get the state directly:

```typescript
const authorState = await client
  .follow('article-collection')
  .follow('item')
  .follow('author')
  .get();

// followAll() chains resolve to an array of states.
const articleStates = await client
  .follow('article-collection')
  .followAll('item')
  .get();
```

Following links from a state
----------------------------

A `State` has `follow()`, `mayFollow()` and `followAll()` methods too. Because
the links are already there, they are synchronous and return resources
directly:

```typescript
const state = await articleCollection.get();

const next = state.follow('next');
const items = state.followAll('item');

// followAll() returns a Resources array, which can fetch all states at once.
const itemStates = await items.get();
```

Templated links
---------------

Some formats support [URI templates][uri-template]. Here is a HAL collection
with a templated `search` link:

```json
{
  "_links": {
    "self": { "href": "/articles" },
    "search": {
      "href": "/articles{?q}",
      "templated": true
    }
  }
}
```

Pass the template variables as the second argument of `follow()`:

```typescript
const searchResult = await articleCollection.follow('search', { q: 'javascript' });
```

Array values expand to repeated query parameters.

Mixing formats
--------------

Each hop can use a different format. The home document could be HTML:

```html
<ul>
  <li><a href="/articles" rel="article-collection">List of articles</a></li>
  <li><a href="/authors" rel="author-collection">List of authors</a></li>
</ul>
```

and the collection HAL, or Siren. The code above works unchanged.

Reading and changing links
--------------------------

Links are not part of `state.data`. They are in `state.links`, a `Links`
object that is the same whatever the format:

```typescript
const state = await articleResource.get();

state.links.has('author');       // true
state.links.get('author');       // The first 'author' link, or undefined
state.links.getMany('author');   // All 'author' links
state.links.getAll();            // All links
```

Links can also be changed, and sent back to the server:

```typescript
const state = await articleResource.get();

state.links.add('category', '/category/5');
// Or: state.links.add({ rel: 'category', href: '/category/5', title: 'News' });

await articleResource.put(state);
```

For HAL, the `PUT` body puts the links back into `_links`:

```json
{
  "_links": {
    "self": { "href": "/article/1" },
    "author": { "href": "/authors/123", "title": "Dr. Pidgin" },
    "category": { "href": "/category/5" }
  },
  "title": "Hello world!",
  "body": "..."
}
```

`set()` replaces all links with a relation, and `delete()` removes them. See
the [API reference](api.md#links) for every method.

Next steps
----------

* [Actions and forms](actions.md)
* [Optimizing many requests](optimizing.md)
* [TypeScript features](typescript.md)

[weblinking]: https://www.rfc-editor.org/rfc/rfc8288
[uri-template]: https://www.rfc-editor.org/rfc/rfc6570
[hal]: https://datatracker.ietf.org/doc/html/draft-kelly-json-hal
[hal-forms]: https://rwcbook.github.io/hal-forms/
[siren]: https://github.com/kevinswiber/siren
[jsonapi]: https://jsonapi.org/
[cj]: http://amundsen.com/media-types/collection/
[html-a]: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a
[html-link]: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/link
