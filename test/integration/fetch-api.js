const Ketting = require('../../lib/ketting');
const Resource = require('../../lib/resource');
const expect = require('chai').expect;
const Request = require('node-fetch').Request;

describe('Using the fetch api', () => {

  let hal2;
  let ketting;
  before( async () => {
    ketting = new Ketting('http://localhost:3000/hal1.json');
    hal2 = await ketting.follow('next');
  });

  it('should return a response object', async() => {

    const response = await hal2.fetch('?foo=bar');
    expect(response).to.have.property('status');
    expect(response.status).to.eql(200);

  });

  it('should also work when passing a Request object', async() => {

    const request = new Request('?foo=bar');
    const response = await hal2.fetch(request);
    expect(response).to.have.property('status');
    expect(response.status).to.eql(200);

  });

  it('should allow overriding the HTTP method', async() => {

    const response = await hal2.fetch({ method: 'PUT' });
    expect(response).to.have.property('status');
    expect(response.status).to.eql(204);

  });

  it('should allow overriding the Content-Type header', async() => {

    const headersResource = await ketting.follow('headerTest');
    const response = await headersResource.fetch({
      method: 'POST',
      headers: {
        'Content-Type' : 'image/png'
      }
    });

    const body = await response.json();
    expect(body['content-type']).to.eql('image/png');

  });

  after( async() => {

    // Clearing any changes.
    await ketting.getResource('/reset').post({});

  });

});
