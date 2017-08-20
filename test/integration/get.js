const Client = require('../../lib/client');
const Resource = require('../../lib/resource');
const Link = require('../../lib/link');
const expect = require('chai').expect;

describe('Issuing a GET request', async () => {

  const client = new Client('http://localhost:3000/hal1.json');
  let resource;
  let result;

  before( async() => {

    resource = await client.follow('headerTest');

  });

  it('should not fail', async() => {

    result = await resource.get();

  });

  it('should have sent the correct headers', async() => {

    expect(result).to.have.property('user-agent');
    expect(result['user-agent']).to.match(/^Restl\//);
    expect(result['accept']).to.eql('application/hal+json,application/json,text/html');
    expect(result['content-type']).to.eql('application/hal+json');

  });

  it('should throw an exception when there was a HTTP error', async() => {

    const resource = await client.follow('error400');
    let exception;
    try {
        await resource.get();
    } catch (ex) {
        exception = ex;
    }
    expect(exception.response.status).to.equal(400);

  });

  it('should support the HTTP Link header', async() => {

    const resource = await client.follow('linkHeader');
    const links = await resource.links();

    const expected = [
      new Link('next', 'http://localhost:3000/link-header', '/hal2.json'),
      new Link('previous', 'http://localhost:3000/link-header', '/TheBook/chapter2'),
      new Link('start', 'http://localhost:3000/link-header', 'http://example.org/'),
      new Link('http://example.net/relation/other', 'http://localhost:3000/link-header', 'http://example.org/')
    ];

    expect(links).to.eql(expected);

  });

});
