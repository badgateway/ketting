import {describe, it, expect} from '#ketting-test';

import {Ketting} from '../../src/index.js';

describe('Issuing a PATCH request', async () => {

  it('should not fail', async ({testApplicationUris}) => {
    const serverUri = testApplicationUris.createTenantUri();
    const ketting = new Ketting(serverUri + '/hal1.json');

    const resource = await ketting.go().follow('echo');
    // Priming the cache
    await resource.get();

    await resource.patch({data: {newData: 'hi!'}});

  });

  it('should throw an exception if there was an http error', async ({testApplicationUris}) => {

    const serverUri = testApplicationUris.createTenantUri();
    const ketting = new Ketting(serverUri + '/hal1.json');

    const resource = await ketting.go().follow('echo');
    // Priming the cache
    await resource.get();

    let ok = false;
    try {
      const errResource = await ketting.follow('error400');
      await errResource.patch({data: {foo: 'bar'}});
    } catch {
      ok = true;
    }
    expect(ok).to.eql(true);

  });

});
