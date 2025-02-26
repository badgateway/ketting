import { describe, it } from 'node:test';

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
  describe('"update" event', () => {

    it('should not trigger when a state served from cache', async() => {

      const client = new Client('http://example');
      client.use( mockFetchMw );
      const resource = client.go('/res');
      await resource.get();

      let triggered = false;
      resource.once('update', () => {
        triggered = true;
      });
      await resource.get();
      expect(triggered).to.equal(false);

    });

    it('should trigger when state is refreshed', async() => {

      const client = new Client('http://example');
      client.use( mockFetchMw );
      const resource = client.go('/res');
      await resource.get();

      let triggered = false;
      resource.once('update', () => {
        triggered = true;
      });
      await resource.refresh();
      expect(triggered).to.equal(true);

    });

    it('should trigger when state is updated with PUT, and it should not trigger a "stale" event', async() => {

      const client = new Client('http://example');
      client.use( mockFetchMw );
      const resource = client.go('/res');
      const oldState = await resource.get();

      let triggeredStale = false;
      let triggeredUpdate = false;
      let newBody = null;
      resource.once('update', (state) => {
        triggeredUpdate = true;
        newBody = state.data;
      });
      resource.once('stale', () => {
        triggeredStale = true;
      });
      oldState.data = 'New body!';
      await resource.put(oldState);
      expect(triggeredUpdate,'"update" event should have triggered').to.equal(true);
      expect(triggeredStale,'"stale" event should not have triggered').to.equal(false);
      expect(newBody).to.equal('New body!');

      // Check cache too.
      const newState = await resource.get();
      expect(newState.data).to.equal('New body!');

    });
    it('should trigger when a response contains a relevant Content-Location header', async() => {

      const client = new Client('http://example');
      client.use( mockFetchMw );
      const resource = client.go('/res');
      await resource.get();

      let triggered = false;
      resource.once('update', () => {
        triggered = true;
      });
      await client.fetcher.fetch('http://example/content-location', { method: 'POST' });
      expect(triggered).to.equal(true);

    });
    it('should not trigger with Content-Location and cache: no-store', async() => {

      const client = new Client('http://example');
      client.use( mockFetchMw );
      const resource = client.go('/res');
      await resource.get();

      let triggered = false;
      resource.once('update', () => {
        triggered = true;
      });
      await client.fetcher.fetch('http://example/content-location', { method: 'POST', cache: 'no-store' });
      expect(triggered).to.equal(false);

    });
  });

  describe('"delete" event', () => {

    it('should trigger after a DELETE request', async () => {

      const client = new Client('http://example');
      client.use( mockFetchMw );
      const resource = client.go('/res');

      let triggeredStale = false;
      let triggeredDelete = false;
      resource.once('delete', () => {
        triggeredDelete = true;
      });
      resource.once('stale', () => {
        triggeredStale = true;
      });
      await resource.delete();
      expect(triggeredDelete,'"delete" event should have triggered').to.equal(true);
      expect(triggeredStale,'"stale" event should not have triggered').to.equal(false);

      // Check cache too.
      expect(client.cache.has('http://example/res')).to.equal(false);

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
};
