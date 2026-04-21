import { describe, it, expect } from '#ketting-test';

import { Resource, Links } from 'ketting';
import { Resources } from '#ketting-dist/state/resources.js';

describe('Resources', () => {

  it('should behave like an Array', () => {

    const fakeResources = [getFakeResource('/a'), getFakeResource('/b')];
    const resources = new Resources(fakeResources);

    expect(resources).to.be.an.instanceof(Array);
    const uris = resources.map(r => r.uri);
    expect(uris).to.eql(['/a', '/b']);

  });

  it('should resolve all resources to their state when get() is called', async () => {

    const fakeResources = [getFakeResource('/a'), getFakeResource('/b')];
    const resources = new Resources(fakeResources);

    const states = await resources.get();
    expect(states).to.have.length(2);
    expect(states[0].uri).to.eql('/a');
    expect(states[1].uri).to.eql('/b');

  });

  it('should return an empty array from get() when there are no resources', async () => {

    const resources = new Resources([]);
    const states = await resources.get();
    expect(states).to.eql([]);

  });

});

function getFakeResource(uri: string = 'https://example.org/') {

  const fakeFetch = (input:any) => {
    let url;
    if (input.url) {
      url = input.url;
    } else {
      url = input;
    }
    switch(url) {
      case 'https://example.org/return-request':
        return input;
      case 'https://example.org/200':
        return new Response('', {status: 200});
      case 'https://example.org/201':
        return new Response('', {status: 201});
      case 'https://example.org/201-loc':
        return new Response('', {status: 201, headers: { 'Location': 'https://evertpot.com/'}});
      case 'https://example.org/205':
        return new Response(null, {status: 205});
    }
  };

  const fakeClient:any = {

    fetcher: {

      fetch: fakeFetch,
      fetchOrThrow: fakeFetch,
    },

    go: (uri:string) => {

      return getFakeResource(uri);

    },

    cache: {

      get: ():null => { return null; },
      store: ():void => { /* Intentionally Empty */ }

    },

    cacheState: (state: any) => {

      return;

    },

    getStateForResponse: () => {

      return {
        uri,
        links: new Links('/', [ { href: '/', rel: 'yes', context: '/' }])
      };

    }

  };
  const resource = new Resource(fakeClient, uri);
  return resource;

}
