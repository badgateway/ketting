import { expect } from 'chai';
import Ketting from '../../src/ketting';
import Resource from '../../src/resource';

describe('Issuing a PATCH request', async () => {

  const ketting = new Ketting('http://localhost:3000/hal1.json');
  let resource: Resource;

  before( async () => {

    resource = await ketting.getResource().follow('echo');
    // Priming the cache
    await resource.get();

  });

  it('should not fail', async () => {

    await resource.patch({newData: 'hi!'});

  });
  it('should have cleared the resource representation', async () => {

    expect(resource.repr).to.eql(null);

  });

  it('should throw an exception if there was an http error', async () => {

    let ok = false;
    try {
      const errResource = await ketting.follow('error400');
      await errResource.patch({foo: 'bar'});
    } catch (e) {
      ok = true;
    }
    expect(ok).to.eql(true);

  });

  after( async () => {

    await ketting.getResource('/reset').post({});

  });

});
