export { default as Client, default as Ketting } from './client';
export { default as Resource } from './resource';

export { JsonApiState } from './state/jsonapi';
export { HalState } from './state/hal';
export { SirenState } from './state/siren';

export { default as basicAuth } from './http/basic-auth';
export { default as bearerAuth } from './http/bearer-auth';

export { Problem } from './http/error';
