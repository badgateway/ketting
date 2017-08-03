const Client = require('../../lib/client');
const Resource = require('../../lib/resource');
const expect = require('chai').expect;
const Request = require('node-fetch').Request;

describe('Using the fetch api', () => {

  let hal2;
  let client;
  before( async () => {
    client = new Client('http://localhost:3000/hal1.json');
    hal2 = await client.follow('next');
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
  after( async() => {

    // Clearing any changes.
    await client.getResource('/reset').post({});

  });

});
