import { Client } from '../../src';
import { expect } from 'chai';

describe('Resource Events', () => {

  describe('"stale" event', () => {

    it('should trigger when an unsafe method is used', async () => {

      const client = new Client('http://example');
      client.use( async(req, next): Promise<Response> => {

        return new Response('OK!');

      });
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
      client.use( async(req, next): Promise<Response> => {

        return new Response('OK!');

      });
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
      client.use( async(req, next): Promise<Response> => {

        return new Response('OK!');

      });
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
      client.use( async(req, next): Promise<Response> => {

        return new Response('OK!');

      });
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
      client.use( async(req, next): Promise<Response> => {

        return new Response('OK!');

      });
      const resource = client.go('/res');
      await resource.get();

      let triggered = false;
      resource.once('stale', () => {
        triggered = true;
      });
      await client.fetcher.fetch('http://example/res', { method: 'SEARCH' });
      expect(triggered).to.equal(false);

    });

  });

});
