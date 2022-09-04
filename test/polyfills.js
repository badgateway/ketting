/* eslint "@typescript-eslint/no-var-requires": 0 */

// For Node 16.x and below
if (!global.fetch) {
  const nodeFetch = require('node-fetch');
  global.fetch = nodeFetch;
  global.Headers = nodeFetch.Headers;
  global.Request = nodeFetch.Request;
  global.Response = nodeFetch.Response;
}


// For Node 14.x and below
if (global.btoa === undefined) {
  global.btoa = input => {
    return Buffer.from(input).toString('base64');
  };
}
