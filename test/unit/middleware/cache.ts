/* eslint-disable no-console */
import { expect } from 'chai';

import { BaseState, Client, ForeverCache, Links, Resource } from '../../../src';

import cacheMiddleware from '../../../src/middlewares/cache';

const invoke = (response: Response, client: Client) => {
  const mw = cacheMiddleware(client);

  return mw(new Request('http://test.example', {
    method: 'POST',
  }), () => Promise.resolve(response));
};

describe('Cache middleware', () => {
  const client = new Client('http://test.example');
  client.cache = new ForeverCache();

  const resource = new Resource(client, 'http://example/foo');
  const resourceEvents: string[] = [];

  beforeEach(() => {
    const state = new BaseState({
      client,
      uri: 'http://example/foo',
      data: 'hi',
      headers: new Headers(),
      links: new Links('http://example/foo')
    });

    client.cache.store(state);

    client.resources.set('http://example/foo', resource);

    resource.emit = event => {
      resourceEvents.push(event);

      return true;
    };
  });

  it('Should normally not emit delete entries from cache', async () => {
    await invoke(new Response(), client);

    expect(client.cache.has('http://example/foo')).to.equal(true);
    expect(resourceEvents).to.not.contain('delete');
  });

  it('Should normally not emit delete event when have rel="invalidates" link', async () => {
    const response = new Response(null, {
      headers: {
        Link: '<http://example/foo>; rel="invalidates"',
      }
    });

    await invoke(response, client);

    expect(resourceEvents).to.not.contain('delete');
  });

  it('Should emit delete entries from cache when have rel="deletes" link', async () => {
    const response = new Response(null, {
      headers: {
        Link: '<http://example/foo>; rel="deletes"',
      }
    });

    await invoke(response, client);

    expect(client.cache.has('http://example/foo')).to.equal(false);
    expect(resourceEvents).to.contain('delete');
  });
});
