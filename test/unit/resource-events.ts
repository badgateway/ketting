import { Client } from '../../src';
import { expect } from 'chai';

describe('Resource Events', () => {

  describe('"stale" event', () => {

    it('should trigger when an unsafe method is used', async () => {

      const client = new Client('http://example');
      client.use( mockFetchMw );

      const resource = client.go('/res');
      await resource.get();

      let triggered = false;
      resource.once('stale', () => {
        triggered = true;
      });
      await resource.post({});
      expect(triggered).to.equal(true);

    });
    it('should trigger when an unsafe method is used via fetch', async () => {

      const client = new Client('http://example');
      client.use( mockFetchMw );

      const resource = client.go('/res');
      await resource.get();

      let triggered = false;
      resource.once('stale', () => {
        triggered = true;
      });
      await resource.fetch({method: 'POST'});
      expect(triggered).to.equal(true);

    });
    it('should not trigger when a safe method is used via fetch', async () => {

      const client = new Client('http://example');
      client.use( mockFetchMw );
      const resource = client.go('/res');
      await resource.get();

      let triggered = false;
      resource.once('stale', () => {
        triggered = true;
      });
      await resource.fetch({method: 'SEARCH'});
      expect(triggered).to.equal(false);

    });
    it('should trigger when an unsafe method is used via the global fetcher', async () => {

      const client = new Client('http://example');
      client.use( mockFetchMw );
      const resource = client.go('/res');
      await resource.get();

      let triggered = false;
      resource.once('stale', () => {
        triggered = true;
      });
      await client.fetcher.fetch('http://example/res', { method: 'POST' });
      expect(triggered).to.equal(true);

    });
    it('should not trigger when a safe method is used via the global fetcher', async () => {

      const client = new Client('http://example');
      client.use( mockFetchMw );
      const resource = client.go('/res');
      await resource.get();

      let triggered = false;
      resource.once('stale', () => {
        triggered = true;
      });
      await client.fetcher.fetch('http://example/res', { method: 'SEARCH' });
      expect(triggered).to.equal(false);

    });
    it('should not trigger for an unrelated request', async() => {

      const client = new Client('http://example');
      client.use( mockFetchMw );
      const resource = client.go('/res');
      await resource.get();

      let triggered = false;
      resource.once('stale', () => {
        triggered = true;
      });
      await client.fetcher.fetch('http://example/unrelated', { method: 'POST' });
      expect(triggered).to.equal(false);

    });
    it('should trigger when a response contains a relevant Location header', async() => {

      const client = new Client('http://example');
      client.use( mockFetchMw );
      const resource = client.go('/res');
      await resource.get();

      let triggered = false;
      resource.once('stale', () => {
        triggered = true;
      });
      await client.fetcher.fetch('http://example/location', { method: 'POST' });
      expect(triggered).to.equal(true);

    });
    it('should trigger when a response contains a relevant Content-Location header', async() => {

      const client = new Client('http://example');
      client.use( mockFetchMw );
      const resource = client.go('/res');
      await resource.get();

      let triggered = false;
      resource.once('stale', () => {
        triggered = true;
      });
      await client.fetcher.fetch('http://example/content-location', { method: 'POST' });
      expect(triggered).to.equal(true);

    });
    it('should trigger when a response contains a relevant Link header', async() => {

      const client = new Client('http://example');
      client.use( mockFetchMw );
      const resource = client.go('/res');
      await resource.get();

      let triggered = false;
      resource.once('stale', () => {
        triggered = true;
      });
      await client.fetcher.fetch('http://example/link', { method: 'POST' });
      expect(triggered).to.equal(true);

    });

  });

});

const mockFetchMw = async(req: Request): Promise<Response> => {
  const headers = new Headers();
  switch(req.url) {
    case 'http://example/location' :
      headers.set('Location', '/res');
      break;
    case 'http://example/content-location' :
      headers.set('Content-Location', '/res');
      break;
    case 'http://example/link' :
      headers.set('Link', '</res>; rel=invalidates');
      break;
  }

  return new Response('OK!', { headers });
}
