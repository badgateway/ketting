import { expect } from 'chai';
import { Client, Resource } from '../../src';

describe('Following a link', async () => {

  const client = new Client('http://localhost:3000/hal1.json');

  let hal2: Resource;

  it('should return a resource', async () => {

    hal2 = await client.follow('next');
    expect(hal2).to.be.an.instanceof(Resource);


  });

  it('should get the correct response to GET', async () => {

    const state = await hal2.get();
    expect(state.data).to.eql({title: 'HAL 2!'});


  });
  it('should be chainable', async () => {

    const hal1 = await client.follow('next').follow('prev');
    const hal1State = await hal1.get();
    expect(hal1State.data).to.eql({title: 'Hal 1', foo: 'bar'});

  });

  it('should throw an error following non-existent relationships', async () => {

    let result;
    try {
      const hal1 = await client.follow('next').follow('unknown');
      await hal1.get();
    } catch (e) {
      result = e;
    }

    expect(result).to.be.instanceof(Error);

  });

  it('should be chainable several times', async () => {

    const hal1 = await client.follow('next').follow('prev').follow('next').follow('prev');
    const hal1State = await hal1.get();
    expect(hal1State.data).to.eql({title: 'Hal 1', foo: 'bar'});

  });

  describe('followAll', () => {
    it('should work with embedded resources', async () => {

      const items = await client.follow('collection').followAll('item');
      expect(items).to.have.length(2);
      expect(items[0]).to.be.an.instanceof(Resource);
      expect(items[1]).to.be.an.instanceof(Resource);

    });

    it('should remember the type="" property for later usage', async () => {

      const newResource = await client.follow('self').followAll('content-type-link');
      expect(newResource[0]).to.be.an.instanceof(Resource);

    });

  });
});
