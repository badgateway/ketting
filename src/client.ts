import { Fetcher, FetchMiddleware } from './http/fetcher';
import Resource from './resource';
import { State, StateFactory } from './state';
import { factory as halState } from './state/hal';
import { factory as binaryState } from './state/binary';
import { factory as jsonApiState } from './state/jsonapi';
import { factory as sirenState } from './state/siren';
import { factory as textState }from './state/text';
import { factory as cjState } from './state/collection-json';
import { factory as htmlState } from './state/collection-json';
import { parseContentType } from './http/util';
import { resolve } from './util/url';
import { LinkVariables } from './link';
import { FollowPromiseOne } from './follow-promise';

export default class Client {

  fetcher: Fetcher;
  bookmarkUri: string;

  contentTypeMap: {
    [mimeType: string]: [StateFactory<any>, string],
  } = {
    'application/hal+json': [halState, '1.0'],
    'application/vnd.api+json': [jsonApiState, '0.9'],
    'application/vnd.siren+json': [jsonApiState, '0.9'],
    'application/vnd.collection+json': [cjState, '0.9'],
    'application/json': [halState, '0.8'],
    'text/html': [htmlState, '0.7'],
  }

  constructor(bookmarkUri: string) {
    this.bookmarkUri = bookmarkUri;
    this.fetcher = new Fetcher();
    this.fetcher.use( this.acceptHeader );
  }

  /**
   * Follows a relationship, based on its reltype. For example, this might be
   * 'alternate', 'item', 'edit' or a custom url-based one.
   *
   * This function can also follow templated uris. You can specify uri
   * variables in the optional variables argument.
   */
  follow<TFollowedResource = any>(rel: string, variables?: LinkVariables): FollowPromiseOne<TFollowedResource> {

    return this.go().follow(rel, variables);

  }

  go(uri?: string): Resource<any> {

    let absoluteUri;
    if (uri !== undefined) {
      absoluteUri = resolve(this.bookmarkUri, uri);
    } else {
      absoluteUri = this.bookmarkUri;
    }
    return new Resource(this, absoluteUri);

  }

  use(middleware: FetchMiddleware, origin: string = '*') {

    this.fetcher.use(middleware, origin);

  }

  /**
   * Clears the entire resource cache
   */
  clearCache() {

    // TODO: Implement cache

  }

  /**
   * Transforms a fetch Response to a State object.
   */
  getStateForResponse(uri: string, response: Response): Promise<State> {

    const contentType = parseContentType(response.headers.get('Content-Type')!);
    if (contentType in this.contentTypeMap) {
      return this.contentTypeMap[contentType][0](uri, response);
    }

    if (contentType.startsWith('text/')) {
      return textState(uri, response);
    } else{
      return binaryState(uri, response);
    }

  }

  private acceptHeader: FetchMiddleware = (request, next) => {

    if (!request.headers.has('Accept')) {
      const acceptHeader = Object.entries(this.contentTypeMap).map(
        ([contentType, [stateFactory, q]]) => contentType + ';q=' + q
      ).join(', ');
      request.headers.set('Accept', acceptHeader);
    }
    return next(request);

  };

}
