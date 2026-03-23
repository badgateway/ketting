import { describe, it, before } from 'node:test';
import testServer from '../testserver';
import { expect } from 'chai';
import { Ketting, Resource } from '../../src';

describe('Using the fetch api', () => {

  const serverUri = testServer();

  let hal2: Resource;
  let ketting: Ketting;
  before( async () => {
    ketting = new Ketting(serverUri + '/hal1.json');
    hal2 = await ketting.follow('next');
  });

  it('should return a response object', async () => {

    const response = await hal2.fetch();
    expect(response).to.have.property('status');
    expect(response.status).to.eql(200);

  });

  it('should also work when passing a Request object', async () => {

    const request = new Request(serverUri + '/?foo=bar');
    const response = await hal2.fetch(request);
    expect(response).to.have.property('status');
    expect(response.status).to.eql(200);

  });

  it('should allow overriding the HTTP method', async () => {

    const response = await hal2.fetch({ method: 'PUT' });
    expect(response).to.have.property('status');
    expect(response.status).to.eql(204);

  });

  it('should allow overriding the Content-Type header', async () => {

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

  it('should allow overriding the User-Agent  header', async () => {

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
