import { describe, it } from 'node:test';
import testServer from '../testserver';

import { expect } from 'chai';
import { Ketting, Resource, BaseState } from '../../src';

describe('Following a JSON API link', async () => {

  const serverUri = testServer();
  const ketting = new Ketting(serverUri + '/hal1.json');

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
    expect(item.uri).to.equal(serverUri + '/json-api-member1.json');

  });
});
