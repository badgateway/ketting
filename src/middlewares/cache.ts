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

  const cacheDependencies: Map<string, Set<string>> = new Map();

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
        if (cacheDependencies.has(uri)) {
          cacheDependencies.get(uri)!.add(request.url);
        } else {
          cacheDependencies.set(uri, new Set(request.url));
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
    let expireUris = new Set<string>();
    if (!noStaleEvent && request.method !== 'DELETE') {
      // Sorry for the double negative
      expireUris.add(request.url);
    }

    // If the response had a Link: rel=invalidate header, we want to
    // expire those too.
    if (response.headers.has('Link')) {
      for (const httpLink of LinkHeader.parse(response.headers.get('Link')!).rel('invalidates')) {
        const uri = resolve(request.url, httpLink.uri);
        expireUris.add(uri);
      }
    }

    // Location headers should also expire
    if (response.headers.has('Location')) {
      expireUris.add(
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
    }

    expireUris = expandCacheDependencies(expireUris, cacheDependencies);
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

function expandCacheDependencies(uris: Set<string>, dependencies: Map<string, Set<string>>, output?: Set<string>): Set<string> {

  if (!output) output = new Set();

  for(const uri of uris) {

    if (!output.has(uri)) {
      output.add(uri);
      if (dependencies.has(uri)) {
        expandCacheDependencies(dependencies.get(uri)!, dependencies, output);
      }
    }

  }

  return output;

}
