import Fetcher from './fetcher';
import Resource from './resource';
import { State, StateFactory } from './state';
import { factory as halState } from './state/hal';
import { factory as binaryState } from './state/binary';
import { factory as textState }from './state/text';
import { parseContentType } from './http/util';

class Client {

  fetcher: Fetcher;

  contentTypeMap: {
    [mimeType: string]: StateFactory<any>
  } = {
    'application/hal+json': halState,
  }

  constructor() {
    this.fetcher = new Fetcher();
  }

  go(path: string): Resource<any> {

    return new Resource(path);

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

export default new Client();
