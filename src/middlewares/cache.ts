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

    // If the response had a Link: rel=inv-by header, it means that when the
    // target uri's cache expires, the uri of this resource should also
    // expire.
    if (response.headers.has('Link')) {
      for (const httpLink of LinkHeader.parse(response.headers.get('Link')!).rel('inv-by')) {
        const uri = resolve(request.url, httpLink.uri);
        if (client.cacheDependencies.has(uri)) {
          client.cacheDependencies.get(uri)!.add(request.url);
        } else {
          client.cacheDependencies.set(uri, new Set([request.url]));
        }
      }
    }


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
      for (const httpLink of LinkHeader.parse(response.headers.get('Link')!).rel('invalidates')) {
        const uri = resolve(request.url, httpLink.uri);
        stale.push(uri);
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
    if (response.headers.has('Content-Location')) {
      const cl = resolve(request.url, response.headers.get('Content-Location')!);
      const clState = await client.getStateForResponse(
        cl,
        response
      );
      client.cacheState(clState);
    }

    return response;

  };

}
