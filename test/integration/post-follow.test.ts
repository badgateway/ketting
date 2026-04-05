import {describe, it, expect} from '#ketting-test';

import {Ketting, Resource} from '#ketting-src';

describe('Issuing a POST request', async () => {


  it('should have returned and created a new resource', async ({testApplicationUris}) => {

    const resource = new Ketting(testApplicationUris.createTenantUri() + '/hal1.json').go();
    const newResource = await resource.postFollow({
      data: { title: 'Posted resource' }
    }) as Resource;

    expect(newResource).to.be.an.instanceof(Resource);
    expect(newResource.uri).to.match(/\.json$/);

    const newBody = await newResource.get();
    expect(newBody.data).to.eql({title: 'Posted resource'});
  });

  it('should throw an exception when there was a HTTP error', async ({testApplicationUris}) => {
    const ketting = new Ketting(testApplicationUris.createTenantUri() + '/hal1.json');

    const resource400 = await ketting.follow('error400');
    let exception;
    try {
      await resource400.postFollow({
        data: {foo: 'bar'}
      });
    } catch (ex: any) {
      exception = ex;
    }
    expect(exception.response.status).to.equal(400);

  });

});
