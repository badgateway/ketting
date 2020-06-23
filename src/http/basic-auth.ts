import { FetchMiddleware } from './fetcher';
import * as base64 from '../util/base64';

export default (userName: string, password: string): FetchMiddleware => {

  const basicAuthHeader = 'Basic ' + base64.encode(userName + ':' + password);

  return (request, next) => {

    request.headers.set('Authorization', basicAuthHeader);
    return next(request);

  };

};
