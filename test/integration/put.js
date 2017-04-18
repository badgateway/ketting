const Client = require('../../lib/client');
const Resource = require('../../lib/resource');
const expect = require('chai').expect;

describe('Issuing a PUT request', async () => {

  const client = new Client('http://localhost:3000/hal1.json');
  let resource;

  before( async() => {

    resource = client.getResource();
    // Priming the cache
    await resource.get();

  });

  it('should not fail', async() => {

    await resource.put({newData: 'hi!'});
  
  });
  it('should have cleared the resource representation', async() => {
 
    const newBody = await resource.get();
    expect(newBody).to.eql({newData: 'hi!'});
    
  });
  it('should have cleared the global cache', async() => {
 
    const newBody = await client.getResource().get();
    expect(newBody).to.eql({newData: 'hi!'});
    
  });

});
