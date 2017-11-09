const Ketting = require('../../lib/ketting');
const Resource = require('../../lib/resource');
const expect = require('chai').expect;
const Request = require('node-fetch').Request;

describe('Bearer Authentication', () => {

  it('should return 401 if no credentials were passed.', async() => {

    const ketting = new Ketting('http://localhost:3000/hal1.json');
    const resource = await ketting.follow('auth-bearer');
    const response = await resource.fetch();
    expect(response.status).to.eql(401);

  });

  it('should return 401 if incorrect credentials were passed.', async() => {

    const ketting = new Ketting('http://localhost:3000/hal1.json', {
      auth: {
        type: 'bearer',
        token: 'bar'
      }
    });
    const resource = await ketting.follow('auth-bearer');
    const response = await resource.fetch();
    expect(response.status).to.eql(401);

  });

  it('should return 200 OK if correct credentials were passed.', async() => {

    const ketting = new Ketting('http://localhost:3000/hal1.json', {
      auth: {
        type: 'bearer',
        token: 'foo'
      }
    });
    const resource = await ketting.follow('auth-bearer');
    const response = await resource.fetch();
    expect(response.status).to.eql(200);

  });

});
