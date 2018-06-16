const Ketting = require('../../src/ketting').default;
const Resource = require('../../src/resource').default;
const expect = require('chai').expect;
const Request = require('node-fetch').Request;

describe('Basic Authentication', () => {

  it('should return 401 if no credentials were passed.', async() => {
  
    const ketting = new Ketting('http://localhost:3000/hal1.json');
    const resource = await ketting.follow('auth-basic');
    const response = await resource.fetch();
    expect(response.status).to.eql(401);

  });

  it('should return 401 if incorrect credentials were passed.', async() => {

    const ketting = new Ketting('http://localhost:3000/hal1.json', {
      auth: {
        type: 'basic',
        userName: 'foo',
        password: 'bar'
      } 
    });
    const resource = await ketting.follow('auth-basic');
    const response = await resource.fetch();
    expect(response.status).to.eql(401);

  });

  it('should return 200 OK if correct credentials were passed.', async() => {

    const ketting = new Ketting('http://localhost:3000/hal1.json', {
      auth: {
        type: 'basic',
        userName: 'user',
        password: 'pass'
      } 
    });
    const resource = await ketting.follow('auth-basic');
    const response = await resource.fetch();
    expect(response.status).to.eql(200);

  });

});
