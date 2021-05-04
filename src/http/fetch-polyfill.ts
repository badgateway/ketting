import {
  default as nodeFetch,
  Headers,
  Request,
  Response,
} from 'node-fetch';

// Registering Fetch as a glboal polyfill
(global as any).fetch = nodeFetch;
(global as any).Request = Request;
(global as any).Headers = Headers;
(global as any).Response = Response;
