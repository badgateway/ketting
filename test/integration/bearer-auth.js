const Client = require('../../lib/client');
const Resource = require('../../lib/resource');
const expect = require('chai').expect;
const Request = require('node-fetch').Request;

describe('OAuth Authentication', () => {

  it('should return 401 if no credentials were passed.', async() => {
  
    const client = new Client('http://localhost:3000/hal1.json');
    const resource = await client.follow('auth-bearer');
    const response = await resource.fetch();
    expect(response.status).to.eql(401);

  });

  it('should return 401 if incorrect credentials were passed.', async() => {

    const client = new Client('http://localhost:3000/hal1.json', {
      auth: {
        type: 'bearer',
        token: 'bar'
      } 
    });
    const resource = await client.follow('auth-bearer');
    const response = await resource.fetch();
    expect(response.status).to.eql(401);

  });

  it('should return 200 OK if correct credentials were passed.', async() => {

    const client = new Client('http://localhost:3000/hal1.json', {
      auth: {
        type: 'bearer',
        token: 'foo'
      } 
    });
    const resource = await client.follow('auth-bearer');
    const response = await resource.fetch();
    expect(response.status).to.eql(200);

  });

});
