import { expect } from 'chai';
import { Ketting } from '../../src';
import Resource from '../../src/resource';

describe('Issuing a POST request', async () => {

  const ketting = new Ketting('http://localhost:3000/hal1.json');
  let resource: Resource;
  let newResource: Resource;

  before( async () => {

    resource = ketting.go();

  });

  it('should not fail', async () => {

    newResource = await resource.postFollow({
      body: { title: 'Posted resource' }
    }) as Resource;

  });

  it('should have returned a new resource', async () => {

    expect(newResource).to.be.an.instanceof(Resource);
    expect(newResource.uri).to.match(/\.json$/);

  });
  it('should have created the new resource', async () => {

    const newBody = await newResource.get();
    expect(newBody.body).to.eql({title: 'Posted resource'});

  });

  it('should throw an exception when there was a HTTP error', async () => {

    const resource400 = await ketting.follow('error400');
    let exception;
    try {
      await resource400.postFollow({
        body: {foo: 'bar'}
      });
    } catch (ex) {
        exception = ex;
    }
    expect(exception.response.status).to.equal(400);

  });

});
