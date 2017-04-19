const Client = require('../../lib/client');
const Resource = require('../../lib/resource');
const expect = require('chai').expect;

describe('Issuing a POST request', async () => {

  const client = new Client('http://localhost:3000/hal1.json');
  let resource;
  let newResource;

  before( async() => {

    resource = client.getResource();

  });

  it('should not fail', async() => {

    newResource = await resource.post({
      title: 'Posted resource'
    });
  
  });

  it('should have returned a new resource', async() => {

    expect(newResource).to.be.an.instanceof(Resource);
    expect(newResource.uri).to.match(/\.json$/);
    
  });
  it('should have created the new resource', async() => {

    const newBody = await newResource.get();
    expect(newBody).to.eql({title: 'Posted resource'});
    
  });


});
