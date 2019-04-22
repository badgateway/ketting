import '../../../src/utils/fetch-polyfill';
import FetchHelper from '../../../src/utils/fetch-helper';
import { expect } from 'chai';

describe('fetch-helper', () => {

  it('should support multi-auth', async () => {

    const fh = new FetchHelper({
      auth: {
        type: 'bearer',
        token: 'keyA',
      },
      match: {
        "foo.example.org": {
          auth: {
            type: 'bearer',
            token: 'keyB',
          }
        },
        "*.example.com": {
          auth: {
            type: 'bearer',
            token: 'keyC',
          }
        }
      }
    });

    let lastRequest: Request;

    // @ts-ignore - ignoring the 'private' keyword 
    fh.innerFetch = async (request: RequestInfo) => {

      lastRequest = new Request(request);
      return new Response('Ok');

    };

    await fh.fetch('http://example.net', {});
    expect(lastRequest.headers.get('Authorization')).to.equal('Bearer keyA');

    await fh.fetch('http://foo.example.org', {});
    expect(lastRequest.headers.get('Authorization')).to.equal('Bearer keyB');

    await fh.fetch('http://foo.example.com', {});
    expect(lastRequest.headers.get('Authorization')).to.equal('Bearer keyC');
  });

});
