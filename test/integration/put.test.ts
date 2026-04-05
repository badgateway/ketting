import {describe, it, expect} from '#ketting-test';

import {Ketting} from '#ketting-src';

describe('Issuing a PUT request', async () => {

  it('should not fail', async ({testApplicationUris}) => {

    const serverUri = testApplicationUris.createTenantUri();
    const ketting = new Ketting(serverUri + '/hal1.json');
    const resource = await ketting.go().follow('next');
    // Priming the cache
    await resource.get();

    await resource.put({
      data: { newData: 'hi!'}
    });

    const newBody = await resource.get();
    expect(newBody.data).to.eql({newData: 'hi!'});

    const newBody2 = await (await ketting.follow('next')).get();
    expect(newBody2.data).to.eql({newData: 'hi!'});
  });

  it('should throw an exception if there was an http error', async ({testApplicationUris}) => {

    const serverUri = testApplicationUris.createTenantUri();
    const ketting = new Ketting(serverUri + '/hal1.json');

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
