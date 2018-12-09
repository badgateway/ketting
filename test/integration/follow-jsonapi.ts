import { expect } from 'chai';
import Ketting from '../../src/ketting';
import Resource from '../../src/resource';
import JsonApiRepresentor from '../../src/representor/jsonapi';

describe('Following a JSON API link', async () => {

  const ketting = new Ketting('http://localhost:3000/hal1.json');

  let jsonapi: Resource;

  it('should return a resource', async () => {

    jsonapi = await ketting.follow('json-api');
    expect(jsonapi).to.be.an.instanceof(Resource);


  });
  it('should use the JSON:API representor', async () => {

    const rep = await jsonapi.representation();
    expect(rep).to.be.an.instanceof(JsonApiRepresentor);

  });
  it('should allow following links further', async () => {
    
    console.log(await jsonapi.links());
    const next = await jsonapi.follow('next');
    expect(next.uri).to.equal('https://example.org/next-jsonapi');

  });
});
