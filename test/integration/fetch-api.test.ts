import {describe, it, expect} from '#ketting-test';
import {Ketting} from '#ketting-src';

describe('Using the fetch api', () => {

  it('should return a response object', async ({testApplicationUris}) => {

    const serverUri = testApplicationUris.createTenantUri();
    const ketting = new Ketting(serverUri + '/hal1.json');
    const hal2 = await ketting.follow('next');

    const response = await hal2.fetch();
    expect(response).to.have.property('status');
    expect(response.status).to.eql(200);

  });

  it('should also work when passing a Request object', async ({testApplicationUris}) => {

    const serverUri = testApplicationUris.createTenantUri();
    const ketting = new Ketting(serverUri + '/hal1.json');
    const hal2 = await ketting.follow('next');

    const request = new Request(serverUri + '/?foo=bar');
    const response = await hal2.fetch(request);
    expect(response).to.have.property('status');
    expect(response.status).to.eql(200);

  });

  it('should allow overriding the HTTP method', async ({testApplicationUris}) => {
    const serverUri = testApplicationUris.createTenantUri();
    const ketting = new Ketting(serverUri + '/hal1.json');
    const hal2 = await ketting.follow('next');

    const response = await hal2.fetch({ method: 'PUT' });
    expect(response).to.have.property('status');
    expect(response.status).to.eql(204);

  });

  it('should allow overriding the Content-Type header', async ({testApplicationUris}) => {

    const serverUri = testApplicationUris.createTenantUri();

    const tempKetting = new Ketting(serverUri + '/hal1.json');

    tempKetting.use( (request, next) => {
      if (!request.headers.has('Content-Type')) {
        request.headers.set('Content-Type', 'application/json');
      }
      return next(request);
    });

    const headersResource = await tempKetting.follow('headerTest');
    const response = await headersResource.fetch({
      method: 'POST',
      headers: {
        'Content-Type' : 'image/png'
      }
    });

    const body = await response.json();
    expect(body['content-type']).to.eql('image/png');

  });

  it('should allow overriding the User-Agent  header', async ({testApplicationUris}) => {

    if (globalThis.window) {
      return;
    }

    const serverUri = testApplicationUris.createTenantUri();
    const ketting = new Ketting(serverUri + '/hal1.json');

    const headersResource = await ketting.follow('headerTest');
    const response = await headersResource.fetch({
      method: 'POST',
      headers: {
        'User-Agent': 'foo-bar/1.2'
      }
    });

    const body = await response.json();
    expect(body['user-agent']).to.eql('foo-bar/1.2');

  });

});
