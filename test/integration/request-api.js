const Client = require('../../lib/client');
const Resource = require('../../lib/resource');
const expect = require('chai').expect;

describe('The Request API', async () => {

  const client = new Client('http://localhost:3000/hal1.json');
  const resource = client.getResource();

  it('should work', async() => {

    const result = await resource.request({
      method: 'GET'
    });
    expect(result.statusCode).to.eql(200);
    expect(result.headers).to.have.property('content-type');
    expect(result.headers['content-type']).to.eql('application/json; charset=utf-8');

  });

  it('should throw an exception if there was an http error', async() => {

    let ok = false;
    try {
      const result = await resource.follow('error400').request({
        method: 'GET'
      });
    } catch (e) {
      ok = true; 
    }
    expect(ok).to.eql(true);

  });

  it('should return the http error information if simple:false', async() => {

    const result = await (await resource.follow('error400')).request({
      method: 'GET',
      simple: false
    });
    expect(result.statusCode).to.eql(400);

  });

  it('should follow redirects', async() => {

    const result = await (await resource.follow('redirect')).request({
      method: 'GET'
    });
    expect(result.statusCode).to.eql(200);
    expect(result.headers['content-type']).to.eql('application/json; charset=utf-8');

  });

  it('should not follow redirects when followRedirect:false', async() => {

    const result = await (await resource.follow('redirect')).request({
      method: 'GET',
      followRedirect: false,
      simple: false
    });
    expect(result.statusCode).to.eql(302);
    expect(result.headers).to.have.property('location');

  });

  it('should set headers when requested', async() => {

    const result = await (await resource.follow('headerTest')).request({
      method: 'GET',
      headers: {
        accept: 'application/foo-bar'
      }
    });

    expect(result.body).to.have.property('accept');
    expect(result.body.accept).to.eql('application/foo-bar');

  });

  it('should understand the auth.bearer setting');

  it('should allow posting json', async() => {

    const echo = await resource.follow('echo');
    const result = await echo.request({
      method: 'POST',
      encoding: null,
      body: {foo: 'bar'}
    });

    expect(result.statusCode).to.eql(200);
    expect(result.headers['content-type']).to.eql('application/json; charset=utf-8');
    expect(result.body).to.eql({foo: 'bar'});

  });

  it('should allow uploading binaries', async() => {

    const echo = await resource.follow('echo');
    const result = await echo.request({
      method: 'POST',
      json: false,
      encoding: null,
      headers: {
        'Content-Type': 'application/octet-binary'
      },
      body: Buffer.from('hello world')
    });

    expect(result.statusCode).to.eql(200);
    expect(result.headers['content-type']).to.eql('application/octet-binary');
    expect(result.body).to.be.an.instanceof(Buffer);
    expect(result.body.toString()).to.eql('hello world');

  });

});
