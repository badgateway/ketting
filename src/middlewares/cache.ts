import { FetchMiddleware } from '../http/fetcher';
import { isSafeMethod } from '../http/util';
import * as LinkHeader from 'http-link-header';
import { resolve } from '../util/uri';
import Client from '../client';

/**
 * This middleware manages the cache based on information in requests
 * and responses.
 *
 * It expires items from the cache and updates the cache if `Content-Location`
 * appeared in the response.
 *
 * It's also responsible for emitting 'stale' events.
 */
export default function(client: Client): FetchMiddleware {

  return async(request, next) => {

    /**
     * Prevent a 'stale' event from being emitted, but only for the main
     * uri
     */
    let noStaleEvent = false;

    if (request.headers.has('X-KETTING-NO-STALE')) {
      noStaleEvent = true;
      request.headers.delete('X-KETTING-NO-STALE');
    }

    const response = await next(request);

    if (isSafeMethod(request.method)) {
      return response;
    }

    if (!response.ok) {
      // There was an error, no cache changes
      return response;
    }

    // We just processed an unsafe method, lets notify all subsystems.
    const stale = [];
    const deleted = [];

    if (request.method === 'DELETE') {
      deleted.push(request.url);
    } else if (!noStaleEvent) {
      stale.push(request.url);
    }

    // If the response had a Link: rel=invalidate header, we want to
    // expire those too.
    if (response.headers.has('Link')) {
      const httpLinks = LinkHeader.parse(response.headers.get('Link')!);

      for (const httpLink of httpLinks.rel('invalidates')) {
        const uri = resolve(request.url, httpLink.uri);
        stale.push(uri);
      }

      for (const httpLink of httpLinks.rel('deletes')) {
        const uri = resolve(request.url, httpLink.uri);
        deleted.push(uri);
      }
    }

    // Location headers should also expire
    if (response.headers.has('Location')) {
      stale.push(
        resolve(request.url, response.headers.get('Location')!)
      );
    }

    client.clearResourceCache(stale, deleted);

    // If the response had a 'Content-Location' header, it means that the
    // response body is the _new_ state for the url in the content-location
    // header, so we store it!
    if (request.cache !== 'no-store' && response.headers.has('Content-Location')) {
      const cl = resolve(request.url, response.headers.get('Content-Location')!);
      const clState = await client.getStateForResponse(
        cl,
        response.clone()
      );
      client.cacheState(clState);
    }

    return response;

  };

}
