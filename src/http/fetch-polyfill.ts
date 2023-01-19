import {
  default as nodeFetch,
  Headers,
  Request,
  Response,
} from 'node-fetch';

const globalThis = global as any;

if (!globalThis.fetch) {
  globalThis.fetch = nodeFetch;
  globalThis.Request = Request;
  globalThis.Headers = Headers;
  globalThis.Response = Response;
}
