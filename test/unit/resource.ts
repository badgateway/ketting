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

  describe('post()', () => {

    it('should return null if 200 OK was returned', async () => {

      const res = getFakeResource('https://example.org/200');
      const result = await res.post({});
      expect(result).to.eql(null);

    });

    it('should return null if 201 Created was returned and no Location header', async () => {

      const res = getFakeResource('https://example.org/201');
      const result = await res.post({});
      expect(result).to.eql(null);

    });

    it('should return a new resource if 201 Created was returned with a new location header', async () => {

      const res = getFakeResource('https://example.org/201-loc');
      const result = await res.post({});
      expect(result!.uri).to.eql('https://evertpot.com/');

    });

    it('should return itself if 205 Reset Content was returned', async () => {

      const res = getFakeResource('https://example.org/205');
      const result = await res.post({});
      expect(result).to.equal(res);

    });
  });

  describe('fetch()', () => {

    it('should use the current uri and a GET request if no arguments were passed', async () => {

      const res = getFakeResource('https://example.org/return-request');
      // @ts-ignore
      const result:any = await res.fetch();

      expect(result).to.equal('https://example.org/return-request');

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
        return new Response('', {status: 205});
    }
  }

  const fakeClient:any = {

    fetcher: {

      fetch: fakeFetch,
      fetchOrThrow: fakeFetch,
    },

    go: (uri:string) => {

      return getFakeResource(uri);

    },

    cache: {

      get: ():null => { return null },
      store: ():void => { }

    },

    getStateForResponse: () => {

      return {
        links: new Links([ { href: '/', rel: 'yes', context: '/' }])
      }

    }

  };
  const resource = new Resource(fakeClient, uri);
  return resource;

}
