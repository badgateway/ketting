const Client = require('../../lib/client');
const Resource = require('../../lib/resource');
const expect = require('chai').expect;

describe('Following a link', async () => {

  const client = new Client('http://localhost:3000/hal1.json');

  let hal2;

  it('should return a resource', async() => {
  
    hal2 = await client.follow('next');
    expect(hal2).to.be.an.instanceof(Resource);

  
  });
  it('should get the correct response to GET', async() => {
  
    const body = await hal2.get();
    expect(body).to.eql({'title': 'HAL 2!'});
    

  });

});
