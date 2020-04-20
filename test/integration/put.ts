import { expect } from 'chai';

import { Ketting, Resource } from '../../src';

describe('Issuing a PUT request', async () => {

  const ketting = new Ketting('http://localhost:3000/hal1.json');
  let resource: Resource;

  before( async () => {

    resource = await ketting.go().follow('next');
    // Priming the cache
    await resource.get();

  });

  it('should not fail', async () => {

    await resource.put({
      body: { newData: 'hi!'}
    });

  });
  it('should have cleared the resource representation', async () => {

    const newBody = await resource.get();
    expect(newBody).to.eql({newData: 'hi!'});

  });
  it('should have cleared the global cache', async () => {

    const newBody = await (await ketting.follow('next')).get();
    expect(newBody).to.eql({newData: 'hi!'});

  });
  it('should throw an exception if there was an http error', async () => {

    let ok = false;
    try {
      const errResource = await ketting.follow('error400');
      await errResource.put({body: {foo: 'bar'}});
    } catch (e) {
      ok = true;
    }
    expect(ok).to.eql(true);

  });

  after( async () => {

    await ketting.go('/reset').post({});

  });

});
