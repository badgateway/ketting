import { expect } from 'chai';

import Ketting from '../../src/ketting';
import Hal from '../../src/representor/hal';
import Html from '../../src/representor/html';
import Siren from '../../src/representor/siren';

describe('Ketting', () => {

  describe('createRepresentation', () => {

    it('should return a HTML representor when requested', () => {

      const ketting = new Ketting('https://example.org/');
      const representor = ketting.createRepresentation('/foo', 'text/html', null, new Map());
      expect(representor).to.be.instanceof(Html);

    });

    it('should return a Hal representor when requested', () => {

      const ketting = new Ketting('https://example.org');
      const representor = ketting.createRepresentation('/foo', 'application/hal+json', null, new Map());
      expect(representor).to.be.instanceof(Hal);

    });

    it('should return a Siren representor when requested', () => {

      const ketting = new Ketting('https://example.org');
      const representor = ketting.createRepresentation('/foo', 'application/vnd.siren+json', null, new Map());
      expect(representor).to.be.instanceof(Siren);

    });

    it('should throw an error when an unknown representor was requested ', () => {

      const ketting = new Ketting('https://example.org');
      expect( () => ketting.createRepresentation('/foo', 'text/plain', '', new Map())).to.throw(Error);

    });

    it('should throw an error an a representor was incorrecly configured ', () => {

      const ketting = new Ketting('https://example.org');
      ketting.contentTypes.push({
        mime: 'text/plain',
        representor: 'bla-bla'
      });
      expect( () => ketting.createRepresentation('/foo', 'text/plain', '', new Map()) ).to.throw(Error);

    });


  });

  describe('Resource caching', () => {

    it('should invalidate a resource\'s cache if an unsafe method was used', () => {

      let cleared = false;

      const ketting = new Ketting('https://example.org');
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

      const ketting = new Ketting('https://example.org');
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

      const ketting = new Ketting('https://example.org');
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
