import { FetchMiddleware } from '../http/fetcher';
import * as LinkHeader from 'http-link-header';
import { resolve } from '../util/uri';

/**
 * This middleware will emit warnings based on HTTP responses.
 *
 * Currently it just inspects the 'Deprecation' HTTP header from
 *   draft-dalal-deprecation-header
 */
export default function(): FetchMiddleware {

  return async(request, next) => {

    const response = await next(request);
    const deprecation = response.headers.get('Deprecation');
    if (deprecation) {
      const sunset = response.headers.get('Sunset');
      let msg = `[Ketting] The resource ${request.url} is deprecated.`;
      if (sunset) {
        msg += ' It will no longer respond ' + sunset;
      }
      if (response.headers.has('Link')) {
        for (const httpLink of LinkHeader.parse(response.headers.get('Link')!).rel('deprecation')) {
          const uri = resolve(request.url, httpLink.uri);
          msg += `See ${uri} for more information.`;
        }
      }

      console.warn(msg);

    }
    return response;

  };

}
