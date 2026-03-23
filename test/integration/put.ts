import { describe, it, before } from 'node:test';
import testServer from '../testserver';

import { expect } from 'chai';

import { Ketting, Resource } from '../../src';

describe('Issuing a PUT request', async () => {

  const serverUri = testServer();
  const ketting = new Ketting(serverUri + '/hal1.json');
  let resource: Resource;

  before( async () => {

    resource = await ketting.go().follow('next');
    // Priming the cache
    await resource.get();

  });

  it('should not fail', async () => {

    await resource.put({
      data: { newData: 'hi!'}
    });

  });
  it('should have cleared the resource representation', async () => {

    const newBody = await resource.get();
    expect(newBody.data).to.eql({newData: 'hi!'});

  });
  it('should have cleared the global cache', async () => {

    const newBody = await (await ketting.follow('next')).get();
    expect(newBody.data).to.eql({newData: 'hi!'});

  });
  it('should throw an exception if there was an http error', async () => {

    let ok = false;
    try {
      const errResource = await ketting.follow('error400');
      await errResource.put({data: {foo: 'bar'}});
    } catch {
      ok = true;
    }
    expect(ok).to.eql(true);

  });

});
