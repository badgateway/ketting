Authentication
==============

Authentication is implemented with [fetch middlewares](middlewares.md) that add
an `Authorization` header to requests. Ketting ships middlewares for:

* HTTP Basic authentication
* Bearer tokens
* OAuth2, through [@badgateway/oauth2-client][oauth2-client]

Basic authentication
--------------------

```typescript
import { Client, basicAuth } from 'ketting';

const client = new Client('https://api.example/');
client.use(basicAuth('userName', 'password'));
```

Bearer token
------------

If you already have a [bearer token][bearer] and it does not need to be
refreshed:

```typescript
import { Client, bearerAuth } from 'ketting';

const client = new Client('https://api.example/');
client.use(bearerAuth('Your secret token goes here'));
```

OAuth2
------

Use `OAuth2Fetch` from [@badgateway/oauth2-client][oauth2-client]. It gets
tokens, adds them to requests, and refreshes them when they expire or when the
server replies `401`. Its `mw()` method returns a Ketting fetch middleware:

    npm i @badgateway/oauth2-client

```typescript
import { Client } from 'ketting';
import { OAuth2Client, OAuth2Fetch } from '@badgateway/oauth2-client';

const oauth2Client = new OAuth2Client({
  server: 'https://auth.example/',
  clientId: 'my-client-id',
  clientSecret: 'my-client-secret',
});

const oauth2Fetch = new OAuth2Fetch({
  client: oauth2Client,
  getNewToken: () => oauth2Client.clientCredentials(),
});

const client = new Client('https://api.example/');
client.use(oauth2Fetch.mw());
```

`getNewToken()` can use any grant the library supports, such as
`oauth2Client.password({ username, password })` or
`oauth2Client.authorizationCode.getToken({ code, redirectUri, codeVerifier })`.
`storeToken` and `getStoredToken` let you persist tokens between sessions.
See the library's documentation for all options, including PKCE and token
introspection.

The `authorization_code` grant starts with redirecting the user to the
authorization server, and ends with the server redirecting back to your
application with a `code`. That navigation is out of Ketting's scope: Ketting
only exchanges the code for a token and talks to the API.

### The deprecated `oauth2()` middleware

Ketting still exports an `oauth2()` function, which wraps
`@badgateway/oauth2-client` behind the options format of older Ketting
versions. It logs a deprecation warning and will be removed in the next major
version. Replace it with `OAuth2Fetch` as shown above.

| `oauth2()` option | `@badgateway/oauth2-client` equivalent |
| --- | --- |
| `clientId`, `clientSecret`, `tokenEndpoint` | `new OAuth2Client({ clientId, clientSecret, tokenEndpoint })` |
| `grantType: 'client_credentials'`, `scope` | `getNewToken: () => client.clientCredentials({ scope })` |
| `grantType: 'password'`, `userName`, `password`, `scope` | `getNewToken: () => client.password({ username, password, scope })` |
| `grantType: 'authorization_code'`, `code`, `redirectUri`, `codeVerifier` | `getNewToken: () => client.authorizationCode.getToken({ code, redirectUri, codeVerifier })` |
| second argument: an existing token | `getStoredToken: () => token` |
| `onTokenUpdate` | `storeToken` |
| `onAuthError` | `onError` |

Authentication per origin
-------------------------

By default, a middleware applies to every request, whatever the domain. When
Ketting follows links to other domains, you may not want to send your
credentials there. Pass an origin as the second argument of `use()`:

```typescript
client.use(bearerAuth('...'), 'https://api.example');
client.use(basicAuth('userName', 'password'), 'https://*.example.org');
```

The pattern is matched against the request's whole origin: scheme, host and
port, without a trailing slash. `*` matches any sequence of characters, so
`'https://*.example.org'` matches every subdomain of `example.org` over HTTPS.

[oauth2-client]: https://www.npmjs.com/package/@badgateway/oauth2-client
[bearer]: https://www.rfc-editor.org/rfc/rfc6750
