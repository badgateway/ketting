import { default as nodeFetch, Headers, Request } from 'node-fetch';

// Registering Fetch as a glboal polyfill
(<any> global).fetch = nodeFetch;
(<any> global).Request = Request;
(<any> global).Headers = Headers;
