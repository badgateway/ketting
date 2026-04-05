import {describe, it, expect} from '#ketting-test';

import {basicAuth, Client} from '#ketting-src';

describe('Basic Authentication', () => {

  it('should return 401 if no credentials were passed.', async ({testApplicationUris}) => {

    const serverUri = testApplicationUris.createTenantUri();

    const client = new Client(serverUri + '/hal1.json');
    const hal1 = client.go();
    const resource = await hal1.follow('auth-basic');
    const response = await resource.fetch({method: 'GET'});
    expect(response.status).to.eql(401);

  });

  it('should return 401 if incorrect credentials were passed.', async ({testApplicationUris}) => {

    const serverUri = testApplicationUris.createTenantUri();

    const client = new Client(serverUri + '/hal1.json');
    client.fetcher.use(basicAuth('foo', 'bar'));
    const resource = await client.follow('auth-basic');
    const response = await resource.fetch({method: 'GET'});
    expect(response.status).to.eql(401);

  });

  it('should return 200 OK if correct credentials were passed.', async ({testApplicationUris}) => {

    const serverUri = testApplicationUris.createTenantUri();

    const ketting = new Client(serverUri + '/hal1.json');
    ketting.fetcher.use(basicAuth('user', 'pass'));
    const resource = await ketting.follow('auth-basic');
    const response = await resource.fetch({method: 'GET'});
    expect(response.status).to.eql(200);

  });

});
