import { expect } from 'chai';
import { Client, TextState, Links } from '../../src';

describe('Client', () => {

  describe('Resource caching', () => {

    it('should invalidate a resource\'s cache if an unsafe method was used', () => {

      const client = new Client('https://example.org');
      client.cache.store(new TextState(
        'https://example.org/foo',
        'hello',
        new Headers(),
        new Links(),
      ));

      const request = new Request('https://example.org/foo', {
        method: 'POST'
      });

      const response = new Response('', {status: 200});
      client.cache.processRequest(request, response);

      expect(client.cache.has('https://example.org/foo')).to.equal(false);

    });

    it('should not invalidate a resource\'s cache if a safe method was used', () => {

      const client = new Client('https://example.org');
      client.cache.store(new TextState(
        'https://example.org/foo',
        'hello',
        new Headers(),
        new Links(),
      ));

      const request = new Request('https://example.org/foo', {
        method: 'SEARCH'
      });

      const response = new Response('', {status: 200});
      client.cache.processRequest(request, response);

      expect(client.cache.has('https://example.org/foo')).to.equal(true);

    });

    it('should invalidate resources if they were mentioned in a Link header with rel="invalidates"', () => {

      const client = new Client('https://example.org');
      client.cache.store(new TextState(
        'https://example.org/foo',
        'hello',
        new Headers(),
        new Links(),
      ));

      const request = new Request('https://example.org/foo', {
        method: 'DELETE',
      });

      const headers = new Headers();
      headers.append('Link', '</bar>; rel="invalidates"');
      headers.append('Link', '</zim>; rel="invalidates"');
      const response = new Response('', {
        status: 200,
        headers
      });

      client.cache.processRequest(request, response);
      expect(client.cache.has('https://example.org/foo')).to.equal(false);

    });

  });

});
