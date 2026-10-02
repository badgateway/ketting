Installation
============

Ketting is published on npm:

    npm i ketting

Requirements
------------

* Node.js 20 or later. Ketting relies on the native `fetch()`, `Request`,
  `Response`, `Headers`, `Blob` and `FormData` globals.
* Any modern browser.

Ketting is an ES module package that targets ES2023 and exposes its entry
point through `package.json#exports`.

Node.js
-------

```typescript
import { Client } from 'ketting';

const client = new Client('https://api.example/');
```

The default export is the same `Client` class, and it is also exported as
`Ketting`:

```typescript
import Ketting from 'ketting';

const client = new Ketting('https://api.example/');
```

CommonJS code can only load Ketting with `require()` on Node.js versions that
support requiring ES modules. Otherwise use a dynamic `import()`.

Browsers
--------

Ketting does not ship a pre-built browser bundle. Use it through a bundler
such as Vite, webpack, Rollup or esbuild; the instructions are the same as for
Node.js.

Bundlers pick up the browser build automatically: Ketting uses the `browser`
condition of `package.json#imports` to parse HTML with the browser's
`DOMParser` instead of the Node.js HTML parser.

Next steps
----------

Read [Getting started](getting-started.md).
