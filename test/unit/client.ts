import { expect } from 'chai';

import { Client } from '../../src';

describe('Client', () => {

  describe('Resource caching', () => {

    it('should invalidate a resource\'s cache if an unsafe method was used', () => {

      let cleared = false;

      const ketting = new Client('https://example.org');
      // @ts-ignore
      ketting.resourceCache['https://example.org/foo'] = {
        clearCache: () => {
          cleared = true;
        }
      };

      const request = new Request('https://example.org/foo', {
        method: 'POST'
      });

      ketting.beforeRequest(request);

      expect(cleared).to.equal(true);

    });

    it('should not invalidate a resource\'s cache if a safe method was used', () => {

      let cleared = false;

      const ketting = new Client('https://example.org');
      // @ts-ignore
      ketting.resourceCache['https://example.org/foo'] = {
        clearCache: () => {
          cleared = true;
        }
      };

      const request = new Request('https://example.org/foo', {
        method: 'SEARCH'
      });

      ketting.beforeRequest(request);

      expect(cleared).to.equal(false);

    });

    it('should invalidate resources if they were mentioned in a Link header with rel="invalidates"', () => {

      let cleared = false;

      const ketting = new Client('https://example.org');
      // @ts-ignore
      ketting.resourceCache['https://example.org/bar'] = {
        clearCache: () => {
          cleared = true;
        }
      };

      const request = new Request('https://example.org/foo', {
        method: 'DELETE'
      });
      const headers = new Headers();
      headers.append('Link', '</bar>; rel="invalidates"');
      headers.append('Link', '</zim>; rel="invalidates"');
      const response = new Response('', {
        status: 200,
        headers
      });

      ketting.afterRequest(request, response);

      expect(cleared).to.equal(true);


    });

  });

});
