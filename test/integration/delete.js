const Client = require('../../lib/client');
const Resource = require('../../lib/resource');
const expect = require('chai').expect;

describe('Issuing a DELETE request', async () => {

  const client = new Client('http://localhost:3000/hal1.json');
  let resource;

  before( async() => {

    resource = client.getResource();
    // Priming the cache
    await resource.get();

  });

  it('should not fail', async() => {

    await resource.delete();
  
  });

  it('should have cleared the resource representation', async() => {

    let ok = false;
    try { 
      const newBody = await resource.get();
    } catch (e) {
      // we're expecting an exception
      ok = true;
    }
    expect(ok).to.eql(true);
    
  });
  it('should have cleared the global cache', async() => {

    let ok = false;
    try { 
      const newBody = await client.getResource().get();
    } catch (e) {
      // we're expecting an exception
      ok = true;
    }
    expect(ok).to.eql(true);
    
  });

  after( async() => {

    await client.getResource('/reset').post({});

  });

});
