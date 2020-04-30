import { FetchMiddleware } from './fetcher';
import { OAuth2Options, OAuth2 } from 'fetch-mw-oauth2';

export default (oauth2Options: OAuth2Options): FetchMiddleware => {

  const oauth2 = new OAuth2(oauth2Options);
  return oauth2.fetchMw.bind(oauth2);

}
