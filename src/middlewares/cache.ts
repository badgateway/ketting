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
    const expireUris = [];
    if (!noStaleEvent && request.method !== 'DELETE') {
      // Sorry for the double negative
      expireUris.push(request.url);
    }

    // If the response had a Link: rel=invalidate header, we want to
    // expire those too.
    if (response.headers.has('Link')) {
      for (const httpLink of LinkHeader.parse(response.headers.get('Link')!).rel('invalidates')) {
        const uri = resolve(request.url, httpLink.uri);
        expireUris.push(uri);
      }
    }

    // Location headers should also expire
    if (response.headers.has('Location')) {
      expireUris.push(
        resolve(request.url, response.headers.get('Location')!)
      );
    }
    // Content-Location headers should also expire
    if (response.headers.has('Content-Location')) {
      const cl = resolve(request.url, response.headers.get('Content-Location')!);
      const clState = await client.getStateForResponse(
        cl,
        response
      );
      client.cacheState(clState);
      expireUris.push(
        resolve(request.url, response.headers.get('Content-Location')!)
      );
    }

    for (const uri of expireUris) {
      client.cache.delete(request.url);

      const resource = client.resources.get(uri);
      if (resource) {
        // We have a resource for this object, notify it as well.
        resource.emit('stale');
      }
    }
    if (request.method === 'DELETE') {
      client.cache.delete(request.url);
      const resource = client.resources.get(request.url);
      if (resource) {
        resource.emit('delete');
      }
    }

    return response;

  };

}
