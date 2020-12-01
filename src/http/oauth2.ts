import { FetchMiddleware } from './fetcher';
import { OAuth2Options, OAuth2, OAuth2Token } from 'fetch-mw-oauth2';

export default (oauth2Options: OAuth2Options & Partial<OAuth2Token>, token?: OAuth2Token): FetchMiddleware => {

  const oauth2 = new OAuth2(oauth2Options, token);
  return oauth2.fetchMw.bind(oauth2);

};
