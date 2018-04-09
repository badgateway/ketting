const Ketting = require('../../src/ketting');
const Resource = require('../../src/resource');
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

  it('should allow overriding the url', async() => {

    const response = await hal2.fetch('?foo=bar', {
      method: 'PUT',
      headers: {
        'X-Foo': 'Bar'
      }
    });
    expect(response).to.have.property('status');
    expect(response.status).to.eql(204);

  });

  it('should allow overriding the Content-Type header', async() => {

    const tempKetting = new Ketting('http://localhost:3000/hal1.json', {
      fetchInit: {
        headers: {
          'Content-Type': 'application/json'
        }
      }
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

  it('should allow overriding the User-Agent  header', async() => {

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

  it('Calling fetch on the client itself should also work', async() => {

    const response = await ketting.fetch('http://localhost:3000/hal1.json',{
      method: 'PUT',
      headers: {
        'X-Foo' : 'Bar'
      }
    });
    expect(response).to.have.property('status');
    expect(response.status).to.eql(204);

  });

  it('should throw a TypeError when passing an incorrect value for input', async() => {

    let result;
    try {
      hal2.fetch(42);
    } catch (e) {
      result = e;
    }
    expect(result).to.be.instanceof(TypeError);

  });

  after( async() => {

    // Clearing any changes.
    await ketting.getResource('/reset').post({});

  });

});
