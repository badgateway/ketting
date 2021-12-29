import { FetchMiddleware } from './fetcher';

export default (userName: string, password: string): FetchMiddleware => {

  const basicAuthHeader = 'Basic ' + btoa(userName + ':' + password);

  return (request, next) => {

    request.headers.set('Authorization', basicAuthHeader);
    return next(request);

  };

};
