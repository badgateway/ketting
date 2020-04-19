import OAuth2 from 'fetch-mw-oauth2';
import { AuthOptions, KettingInit } from '../types';
import './fetch-polyfill';

type DomainOptions = {
  fetchInit?: RequestInit,
  auth?: AuthOptions,
  authBucket: string,
};

type beforeRequestCallback = (request: Request) => void;
type afterRequestCallback = (request: Request, response: Response) => void;

/**
 * This class is primarily responsible for calling fetch().
 *
 * It's main purpose besides that is to add authentication headers, and
 * any defaults that might have been set.
 */
export default class FetchHelper {

  /**
   * Returns a list of all Ketting options.
   *
   * The primary purpose of this is for hydrating all options in for example LocalStorage.
   *
   * The options will not be an exact copy of what was passed, but instead will
   * contain properties like refreshToken and accessToken, allowing authentication information
   * to be cached.
   *
   * NOTE that this function is experimental and only handles top-level settings, and not for
   * specific domains.
   */
  async getOptions(): Promise<KettingInit> {

    const options = this.getDomainOptions('*');
    let auth;

    if (options.auth && options.auth.type === 'oauth2') {
      const oauth2 = this.getOAuth2Bucket(options);
      auth = {
        type: 'oauth2' as 'oauth2',
        ...await oauth2.getOptions(),
      };
    } else {
      auth = options.auth;
    }

    return {
      fetchInit: options.fetchInit,
      auth,
    };

  }

}
