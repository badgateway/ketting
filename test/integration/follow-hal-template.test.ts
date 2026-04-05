import {describe, it, expect} from '#ketting-test';

import {Ketting, Resource} from 'ketting';

describe('Following a templated link', async () => {

  it('should have expanded the uri', async ({testApplicationUris}) => {

    const serverUri = testApplicationUris.createTenantUri();
    const ketting = new Ketting(serverUri + '/hal1.json');

    const hal2 = await ketting.follow('templated', {foo: 'bar'});
    expect(hal2).to.be.an.instanceof(Resource);
    expect(hal2.uri).to.eql(serverUri + '/templated.json?foo=bar');

  });

  it('should have expanded the uri after several follows', async ({testApplicationUris}) => {

    const serverUri = testApplicationUris.createTenantUri();
    const ketting = new Ketting(serverUri + '/hal1.json');

    const hal2 = await ketting.follow('next').follow('prev').follow('templated', {foo: 'bar'});
    expect(hal2).to.be.an.instanceof(Resource);
    expect(hal2.uri).to.eql(serverUri + '/templated.json?foo=bar');

  });

  it('should work even if no variables are specified', async ({testApplicationUris}) => {
    const serverUri = testApplicationUris.createTenantUri();
    const ketting = new Ketting(serverUri + '/hal1.json');

    const hal2 = await ketting.follow('next').follow('prev').follow('templated');
    expect(hal2).to.be.an.instanceof(Resource);
    expect(hal2.uri).to.eql(serverUri + '/templated.json');

  });

});
