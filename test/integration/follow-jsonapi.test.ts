import {describe, it, expect} from '#ketting-test';

import {BaseState, Ketting, Resource} from '#ketting-src';

describe('Following a JSON API link', async () => {

  it('should return a resource', async ({testApplicationUris}) => {

    const ketting = new Ketting(testApplicationUris.createTenantUri() + '/hal1.json');
    const jsonapi = await ketting.follow('json-api');
    expect(jsonapi).to.be.an.instanceof(Resource);
  });

  it('should use the JSON:API representor', async ({testApplicationUris}) => {

    const ketting = new Ketting(testApplicationUris.createTenantUri() + '/hal1.json');
    const jsonapi = await ketting.follow('json-api');
    const rep = await jsonapi.get();
    expect(rep).to.be.an.instanceof(BaseState);

  });
  it('should allow following links further', async ({testApplicationUris}) => {

    const ketting = new Ketting(testApplicationUris.createTenantUri() + '/hal1.json');
    const jsonapi = await ketting.follow('json-api');
    const next = await jsonapi.follow('next');
    expect(next.uri).to.equal('https://example.org/next-jsonapi');

  });
  it('should allow following collection members via the "item" rel', async ({testApplicationUris}) => {

    const serverUri = testApplicationUris.createTenantUri();
    const ketting = new Ketting(serverUri + '/hal1.json');
    const jsonapi = await ketting.follow('json-api');
    const item = await jsonapi.follow('item');
    expect(item.uri).to.equal(serverUri + '/json-api-member1.json');

  });
});
