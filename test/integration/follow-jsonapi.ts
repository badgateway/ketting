import { expect } from 'chai';
import { Ketting, Resource, BaseState } from '../../src';

describe('Following a JSON API link', async () => {

  const ketting = new Ketting('http://localhost:3000/hal1.json');

  let jsonapi: Resource;

  it('should return a resource', async () => {

    jsonapi = await ketting.follow('json-api');
    expect(jsonapi).to.be.an.instanceof(Resource);


  });
  it('should use the JSON:API representor', async () => {

    const rep = await jsonapi.get();
    expect(rep).to.be.an.instanceof(BaseState);

  });
  it('should allow following links further', async () => {

    const next = await jsonapi.follow('next');
    expect(next.uri).to.equal('https://example.org/next-jsonapi');

  });
  it('should allow following collection members via the "item" rel', async () => {

    const item = await jsonapi.follow('item');
    expect(item.uri).to.equal('http://localhost:3000/json-api-member1.json');

  });
});
