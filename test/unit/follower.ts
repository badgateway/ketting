import Resource from '../../src/resource';
import { FollowerOne, FollowerMany } from '../../src/follower';
import { expect } from 'chai';
import Link from '../../src/link';


describe('FollowerOne', () => {

  it('should resolve to a linked resource', async() => {

    const follower = new FollowerOne(getFakeResource(), 'rel1');
    const newResource = await follower;
    expect(newResource.uri).to.equal('https://example.org/child1');

  });

  it('should support templated links', async() => {

    const follower = new FollowerOne(getFakeResource(), 'templated', {q: 'foo'});
    const newResource = await follower;
    expect(newResource.uri).to.equal('https://example.org/templated?q=foo');

  });

  it('should support chaining with follow()', async() => {

    const follower = new FollowerOne(getFakeResource(), 'rel1');
    const newResource = await follower.follow('rel2');
    expect(newResource.uri).to.equal('https://example.org/child2');

  });
  it('should support chaining with followAll()', async() => {

    const follower = new FollowerOne(getFakeResource(), 'rel1');
    const newResource = await follower.followAll('rel2');
    expect(newResource[0].uri).to.equal('https://example.org/child2');

  });

  it('should pass on the "type" attribute of a link if it was set', async() => {

    const follower = new FollowerOne(getFakeResource(), 'csv');
    const newResource = await follower;
    expect(newResource.contentType).to.eql('text/csv');

  });

  it('should trigger catch() on failure', async() => {

    const follower = new FollowerOne(getFakeResource(), 'error');

    let caught = false;

    await follower.catch( err => { caught = true; });
    expect(caught).to.equal(true);

  });

  it('should add a Prefer-Push header to the next refresh if requested', async() => {

    const fakeResource = getFakeResource();
    const follower = new FollowerOne(fakeResource, 'rel1');
    await follower.preferPush();
    expect(
      (fakeResource as any).nextRefreshHeaders
    ).to.eql({
      'Prefer-Push': 'rel1'
    });

  });

  it('should add a Prefer: transclude= header to the next refresh if requested', async() => {

    const fakeResource = getFakeResource();
    const follower = new FollowerOne(fakeResource, 'rel1');
    await follower.preferTransclude();
    expect(
      (fakeResource as any).nextRefreshHeaders
    ).to.eql({
      'Prefer': 'transclude=rel1'
    });

  });

  it('should not prefetch if not requested', async () => {

    const fakeResource = getFakeResource();
    const follower = new FollowerOne(fakeResource, 'rel1');
    const newResource = await follower;
    expect(await newResource.get()).to.eql({firstGet: true});

  });

  it('should respect preFetch() if requested', async () => {

    const fakeResource = getFakeResource();
    const follower = new FollowerOne(fakeResource, 'rel1');
    const newResource = await follower.preFetch();
    expect(await newResource.get()).to.eql({firstGet: false});

  });

  it('should silently handle failed prefetches', async() => {

    const fakeResource = getFakeResource();
    const follower = new FollowerOne(fakeResource, 'error-get');
    await follower.preFetch();

  });

});


describe('FollowerMany', () => {

  it('should resolve to an array of linked resources', async() => {

    const follower = new FollowerMany(getFakeResource(), 'rel1');
    const resources = await follower;
    expect(resources[0].uri).to.equal('https://example.org/child1');

  });

  it('should pass on the "type" attribute of a link if it was set', async() => {

    const follower = new FollowerMany(getFakeResource(), 'csv');
    const newResource = await follower;
    expect(newResource[0].contentType).to.eql('text/csv');

  });

  it('should trigger catch() on failure', async() => {

    const follower = new FollowerMany(getFakeResource(), 'error');

    let caught = false;

    await follower.catch( err => { caught = true; });
    expect(caught).to.equal(true);

  });

  it('should add a Prefer-Push header to the next refresh if requested', async() => {

    const fakeResource = getFakeResource();
    const follower = new FollowerMany(fakeResource, 'rel1');
    await follower.preferPush();
    expect(
      (fakeResource as any).nextRefreshHeaders
    ).to.eql({
      'Prefer-Push': 'rel1'
    });

  });

  it('should add a Prefer: transclude= header to the next refresh if requested', async() => {

    const fakeResource = getFakeResource();
    const follower = new FollowerMany(fakeResource, 'rel1');
    await follower.preferTransclude();
    expect(
      (fakeResource as any).nextRefreshHeaders
    ).to.eql({
      'Prefer': 'transclude=rel1'
    });

  });

  it('should not prefetch if not requested', async () => {

    const fakeResource = getFakeResource();
    const follower = new FollowerMany(fakeResource, 'rel1');
    const newResource = await follower;
    expect(await newResource[0].get()).to.eql({firstGet: true});

  });

  it('should respect preFetch() if requested', async () => {

    const fakeResource = getFakeResource();
    const follower = new FollowerMany(fakeResource, 'rel1');
    const newResource = await follower.preFetch();
    expect(await newResource[0].get()).to.eql({firstGet: false});

  });

  it('should silently handle failed prefetches', async() => {

    const fakeResource = getFakeResource();
    const follower = new FollowerMany(fakeResource, 'error-get');
    await follower.preFetch();

  });
});

function getFakeResource(uri?: string, type?: string): Resource<{ firstGet: boolean }> {

  if (!uri) uri = 'https://example.org';
  const fakeResource = new Resource(null as any, uri, type);
  const links = [
    new Link({
      context: fakeResource.uri,
      href: '/child1',
      rel: 'rel1',
    }),
    new Link({
      context: fakeResource.uri,
      href: '/child2',
      rel: 'rel2',
    }),
    new Link({
      context: fakeResource.uri,
      href: '/csv',
      rel: 'csv',
      type: 'text/csv'
    }),
    new Link({
      context: fakeResource.uri,
      href: '/error-get',
      rel: 'error-get',
    }),
    new Link({
      context: fakeResource.uri,
      href: '/templated{?q}',
      rel: 'templated',
      templated: true,
    }),
  ];

  fakeResource.link = async (rel:string) => {

    if (rel==='error') {
      throw new Error('Fail!!');
    }

    const link = links.find( link => link.rel === rel );
    if (!link) throw new Error('Link with this rel not found');
    return link;
  };
  fakeResource.links = async (rel:string) => {
    if (rel==='error') {
      throw new Error('Fail!!');
    }
    return links.filter( link => link.rel === rel );
  };
  fakeResource.go = (uri: string): Resource<any> => {
    return getFakeResource(uri);
  }

  // The response to get() is hijacked just to communicate
  // if a get() was issued previously. This will be used for
  // testing prefetch.
  let firstGet = true;
  fakeResource.get = async() => {
    
    if (fakeResource.uri === 'https://example.org/error-get') {
      throw new Error('Error on GET method');
    }

    const response = {
      firstGet
    };
    firstGet = false;
    return response;
  }

  return fakeResource;

}
