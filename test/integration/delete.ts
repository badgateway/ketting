import { expect } from 'chai';
import { Client, Problem, Resource } from '../../src';

describe('Issuing a DELETE request', async () => {

  const ketting = new Client('http://localhost:3000/hal1.json');
  let resource: Resource;

  before( async () => {

    resource = ketting.go();
    // Priming the cache
    await resource.get();

  });

  it('should not fail', async () => {

    await resource.delete();

  });

  it('should have cleared the resource representation', async () => {

    let ok = false;
    try {
      await resource.get();
    } catch (e) {
      // we're expecting an exception
      ok = true;
    }
    expect(ok).to.eql(true);

  });
  it('should have cleared the global cache', async () => {

    let ok = false;
    try {
      await ketting.go().get();
    } catch (e) {
      // we're expecting an exception
      ok = true;
    }
    expect(ok).to.eql(true);

  });

  it('should throw an exception when there was a HTTP error', async () => {

    // Resetting the server
    await ketting.go('/reset').fetch({method: 'POST'});
    ketting.clearCache();
    const resource2 = await ketting.follow('error400');
    let exception = null;
    try {
        await resource2.delete();
    } catch (ex) {
        exception = ex;
    }
    expect(exception.response.status).to.equal(400);

  });

  it('should throw a Problem exception when there was a HTTP error with a application/problem+json response', async () => {

    // Resetting the server
    await ketting.go('/reset').fetch({method: 'POST'});
    ketting.clearCache();
    const resource2 = await ketting.follow('problem');
    let exception;
    try {
        await resource2.delete();
    } catch (ex) {
        exception = ex;
    }
    expect(exception.status).to.equal(410);
    expect(exception).to.be.an.instanceof(Problem);
    expect(exception.message).to.equal('HTTP Error 410: Some sort of error!');

  });

  after( async () => {

    await ketting.go('/reset').post({});

  });

});
