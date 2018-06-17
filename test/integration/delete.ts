import Ketting from '../../src/ketting';
import Resource from '../../src/resource';
import { expect } from 'chai';
import { Request } from 'cross-fetch';
import Problem from '../../src/http-error';

describe('Issuing a DELETE request', async () => {

  const ketting = new Ketting('http://localhost:3000/hal1.json');
  let resource;

  before( async() => {

    resource = ketting.getResource();
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
      const newBody = await ketting.getResource().get();
    } catch (e) {
      // we're expecting an exception
      ok = true;
    }
    expect(ok).to.eql(true);
    
  });

  it('should throw an exception when there was a HTTP error', async() => {

    // Resetting the server
    await ketting.getResource('/reset').post({});
    ketting.resourceCache = {};
    const resource = await ketting.follow('error400');
    let exception;
    try {
        await resource.delete();
    } catch (ex) {
        exception = ex;
    }
    expect(exception.response.status).to.equal(400);

  });

  it('should throw a Problem exception when there was a HTTP error with a application/problem+json response', async() => {

    // Resetting the server
    await ketting.getResource('/reset').post({});
    ketting.resourceCache = {};
    const resource = await ketting.follow('problem');
    let exception;
    try {
        await resource.delete();
    } catch (ex) {
        exception = ex;
    }
    expect(exception.status).to.equal(410);
    expect(exception).to.be.an.instanceof(Problem);
    expect(exception.message).to.equal('HTTP Error 410: Some sort of error!');

  });

  after( async() => {

    await ketting.getResource('/reset').post({});

  });

});
