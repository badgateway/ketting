import { expect } from 'chai';
import { Client, TextState, Links, HalState } from '../../src';

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

    it('should cache embedded resources', async() => {

      const client = new Client('https://example.org');
      const body = {
        _embedded: {
          rel: {
            _links: {
              self: { href: '/embedded'},
            },
            item: 1
          }
        },
        item: 2,
      };
      const response = new Response(JSON.stringify(body), {
        headers: { 'Content-Type': 'application/hal+json'}
      });

      const halState = await client.getStateForResponse('https://example.org/parent', response);
      expect(halState.uri).to.equal('https://example.org/parent');
      expect(halState.body).to.eql({item: 2});

      expect(client.cache.has('https://example.org/embedded')).to.equal(true);

      const embedded = client.cache.get('https://example.org/embedded')!;
      expect(embedded).to.be.an.instanceof(HalState);
      expect(embedded.uri).to.equal('https://example.org/embedded');
      expect(embedded.body).to.eql({item: 1});

    });

    it('should cache nested embedded resources', async() => {

      const client = new Client('https://example.org');
      const body = {
        _embedded: {
          rel: {
            _links: {
              self: { href: '/embedded'},
            },
            item: 1,
            _embedded: {
              rel: {
                _links: {
                  self: { href: '/nested'}
                },
                item: 3
              }
            },
          }
        },
        item: 2,
      };
      const response = new Response(JSON.stringify(body), {
        headers: { 'Content-Type': 'application/hal+json'}
      });

      const halState = await client.getStateForResponse('https://example.org/parent', response);
      expect(halState.uri).to.equal('https://example.org/parent');
      expect(halState.body).to.eql({item: 2});

      expect(client.cache.has('https://example.org/nested')).to.equal(true);

      const embedded = client.cache.get('https://example.org/nested')!;
      expect(embedded).to.be.an.instanceof(HalState);
      expect(embedded.uri).to.equal('https://example.org/nested');
      expect(embedded.body).to.eql({item: 3});

    });
  });

});
