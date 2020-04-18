import Fetcher from './http/fetcher';
import Resource from './resource';
import { State, StateFactory } from './state';
import { factory as halState } from './state/hal';
import { factory as binaryState } from './state/binary';
import { factory as textState }from './state/text';
import { parseContentType } from './http/util';
import { resolve } from './util/url';
import { LinkVariables } from './link';
import { FollowPromiseOne } from './follow-promise';

export default class Client {

  fetcher: Fetcher;
  bookmarkUri: string;

  contentTypeMap: {
    [mimeType: string]: StateFactory<any>
  } = {
    'application/hal+json': halState,
    'application/json': halState,
  }

  constructor(bookmarkUri: string) {
    this.bookmarkUri = bookmarkUri;
    this.fetcher = new Fetcher();
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

  /**
   * Transforms a fetch Response to a State object.
   */
  getStateForResponse(uri: string, response: Response): Promise<State> {

    const contentType = parseContentType(response.headers.get('Content-Type')!);
    if (contentType in this.contentTypeMap) {
      return this.contentTypeMap[contentType](uri, response);
    }

    if (contentType.startsWith('text/')) {
      return textState(uri, response);
    } else{
      return binaryState(uri, response);
    }

  }

}
