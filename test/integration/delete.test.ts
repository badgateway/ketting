import {before, describe, it} from 'node:test';

import {expect} from 'chai';
import {Client, Problem, Resource} from '../../src/index.js';
import {createTenantUri} from '../test-application-uris.js';

describe('Issuing a DELETE request', () => {

  const serverUri = createTenantUri();

  const ketting = new Client(serverUri + '/hal1.json');
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
    } catch {
      // we're expecting an exception
      ok = true;
    }
    expect(ok).to.eql(true);

  });
  it('should have cleared the global cache', async () => {

    let ok = false;
    try {
      await ketting.go().get();
    } catch {
      // we're expecting an exception
      ok = true;
    }
    expect(ok).to.eql(true);

  });

  it('should throw an exception when there was a HTTP error', async () => {

    // Resetting the server
    await ketting.go(serverUri + '/reset').post({});
    ketting.clearCache();
    const resource2 = await ketting.follow('error400');
    let exception = null;
    try {
      await resource2.delete();
    } catch (ex: any) {
      exception = ex;
    }
    expect(exception.response.status).to.equal(400);

  });

  it('should throw a Problem exception when there was a HTTP error with a application/problem+json response', async () => {

    // Resetting the server
    await ketting.go(serverUri + '/reset').fetch({method: 'POST'});
    ketting.clearCache();
    const resource2 = await ketting.follow('problem');
    let exception;
    try {
      await resource2.delete();
    } catch (ex: any) {
      exception = ex;
    }
    expect(exception.status).to.equal(410);
    expect(exception).to.be.an.instanceof(Problem);
    expect(exception.message).to.equal('HTTP Error 410: Some sort of error!');

  });

});
