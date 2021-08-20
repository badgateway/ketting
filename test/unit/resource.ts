import { expect } from 'chai';
import { Resource, Links } from '../../src';

describe('Resource', () => {

  describe('hasLink', () => {

    it('should work()', async() => {

      const res = getFakeResource();
      expect(await res.hasLink('yes')).to.equal(true);
      expect(await res.hasLink('no')).to.equal(false);

    });

  });

  describe('follow()', () => {

    it('should return a FollowerOne object',  () => {

      const res = getFakeResource();
      const follower = res.follow('foo');
      expect(follower).to.have.property('preFetch');
      expect(follower).to.have.property('followAll');

    });

  });

  describe('followAll()', () => {

    it('should return a FollowerMany object',  () => {

      const res = getFakeResource();
      const follower = res.followAll('foo');
      expect(follower).to.have.property('preFetch');
      expect(follower).to.not.have.property('followAll');

    });

  });

  describe('postFollow()', () => {

    it('should throw an error if 200 OK was returned', async () => {

      const res = getFakeResource('https://example.org/200');
      let err = false;
      try {
        await res.postFollow({});
      } catch (e) {
        err = true;
      }
      expect(err).to.eql(true);

    });

    it('should throw an error if 201 Created was returned and no Location header', async () => {

      const res = getFakeResource('https://example.org/201');
      let err = false;
      try {
        await res.postFollow({});
      } catch (e) {
        err = true;
      }
      expect(err).to.eql(true);

    });

    it('should return a new resource if 201 Created was returned with a new location header', async () => {

      const res = getFakeResource('https://example.org/201-loc');
      const result = await res.postFollow({});
      expect(result!.uri).to.eql('https://evertpot.com/');

    });

    it('should return itself if 205 Reset Content was returned', async () => {

      const res = getFakeResource('https://example.org/205');
      const result = await res.postFollow({data: ''});
      expect(result).to.equal(res);

    });
  });

  describe('fetch()', () => {

    it('should use the current uri and a GET request if no arguments were passed', async () => {

      const res = getFakeResource('https://example.org/return-request');
      const result:any = await res.fetch();

      expect(result).to.equal('https://example.org/return-request');

    });

  });

  describe('Resource.ActiveRefreshes', () => {

    it('duplicated headers key are handled', async () => {

      const res: any = getFakeResource('https://example.org/return-request');

      const headers = new Headers({'foo': 'bar'});
      headers.append('foo', 'baz');
      const headers2 = new Headers({'foo': 'bar'});

      res.activeRefreshes.put(res.uri, {headers: headers}, null);
      res.activeRefreshes.put(res.uri, {headers: headers2}, null);

      expect((res.activeRefreshes as any).refreshByHash.size).to.equal(2);
    });
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
