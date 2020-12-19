import { FetchMiddleware } from '../http/fetcher';
import Client from '../client';

/**
 * This middleware injects a default Accept header.
 *
 * The list of content-types is generated from the Client's
 * 'contentTypeMap'.
 */
export default function(client: Client): FetchMiddleware {

  return async(request, next) => {

    if (!request.headers.has('Accept')) {
      const acceptHeader = Object.entries(client.contentTypeMap).map(
        ([contentType, [stateFactory, q]]) => contentType + ';q=' + q
      ).join(', ');
      request.headers.set('Accept', acceptHeader);
    }
    return next(request);

  };

}
