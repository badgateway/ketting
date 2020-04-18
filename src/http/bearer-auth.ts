import { FetchMiddleware } from './fetcher';

export default (token: string): FetchMiddleware => {

  const bearerAuthHeader = 'Bearer ' + token;

  return (request, next) => {

    request.headers.set('Authorization', bearerAuthHeader);
    return next(request);

  };

}
