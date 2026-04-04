import {it, describe, expect} from '#ketting-test';

import {Client, Problem} from '../../src/index.js';

describe('Issuing a DELETE request', () => {

  it('should have cleared the resource representation', async ({testApplicationUris}) => {

    const ketting = new Client(testApplicationUris.createTenantUri() + '/hal1.json');

    const resource = ketting.go();
    // Priming the cache
    await resource.get();
    await resource.delete();

    let ok = false;
    try {
      await resource.get();
    } catch {
      // we're expecting an exception
      ok = true;
    }
    expect(ok).to.eql(true);
  });

  it('should have cleared the global cache', async ({testApplicationUris}) => {
    const ketting = new Client(testApplicationUris.createTenantUri() + '/hal1.json');
    const resource = ketting.go();
    // Priming the cache
    await resource.get();
    await resource.delete();

    let ok = false;
    try {
      await ketting.go().get();
    } catch {
      // we're expecting an exception
      ok = true;
    }
    expect(ok).to.eql(true);

  });

  it('should throw an exception when there was a HTTP error', async ({testApplicationUris}) => {

    const ketting = new Client(testApplicationUris.createTenantUri() + '/hal1.json');
    const resource = await ketting.follow('error400');
    let exception = null;
    try {
      await resource.delete();
    } catch (ex: any) {
      exception = ex;
    }
    expect(exception.response.status).to.equal(400);

  });

  it('should throw a Problem exception when there was a HTTP error with a application/problem+json response', async ({testApplicationUris}) => {

    const ketting = new Client(testApplicationUris.createTenantUri() + '/hal1.json');
    const resource = await ketting.follow('problem');
    let exception;
    try {
      await resource.delete();
    } catch (ex: any) {
      exception = ex;
    }
    expect(exception.status).to.equal(410);
    expect(exception).to.be.an.instanceof(Problem);
    expect(exception.message).to.equal('HTTP Error 410: Some sort of error!');

  });

});
