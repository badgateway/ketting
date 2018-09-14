import { default as nodeFetch, Request, Headers } from 'node-fetch';

// Registering Fetch as a glboal polyfill
(<any> global).fetch = nodeFetch;
(<any> global).Request = Request;
(<any> global).Headers = Headers;
