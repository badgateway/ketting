const Ketting = require('../../src/ketting');
const Resource = require('../../src/resource');
const expect = require('chai').expect;

describe('Issuing a POST request', async () => {

  const ketting = new Ketting('http://localhost:3000/hal1.json');
  let resource;
  let newResource;

  before( async() => {

    resource = ketting.getResource();

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

  it('should throw an exception when there was a HTTP error', async() => {

    const resource = await ketting.follow('error400');
    let exception;
    try {
        await resource.post({foo: 'bar'});
    } catch (ex) {
        exception = ex;
    }
    expect(exception.response.status).to.equal(400);

  });

});
