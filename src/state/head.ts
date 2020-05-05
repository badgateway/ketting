import { HeadState } from './interface';
import { parseLink } from '../http/util';

/**
 * Turns the response to a HTTP Head request into a HeadState object.
 *
 * HeadState is a bit different from normal State objects, because it's
 * missing a bunch of information.
 */
export const factory = async (uri: string, response: Response): Promise<HeadState> => {

  const links = parseLink(uri, response.headers.get('Link'));

  return {
    uri,
    headers: response.headers,
    contentHeaders: (): Headers => {

      const contentHeaderNames = [
        'Content-Type',
        'Content-Language',
      ];

      const result: {[name: string]: string} = {};

      for(const contentHeader of contentHeaderNames) {
        if (response.headers.has(contentHeader)) {
          result[contentHeader] = response.headers.get(contentHeader)!;
        }
      }
      return new Headers(result);

    },
    links,
    timestamp: Date.now(),
  };

}
