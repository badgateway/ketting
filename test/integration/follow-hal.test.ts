import {describe, it, expect} from '#ketting-test';
import {Client, isState, Resource} from '../../src/index.js';

describe('Following a link', async () => {

  let hal2: Resource;

  it('should return a resource', async ({testApplicationUris}) => {

    const serverUri = testApplicationUris.createTenantUri();
    const client = new Client(serverUri + '/hal1.json');

    hal2 = await client.follow('next');
    expect(hal2).to.be.an.instanceof(Resource);


  });

  it('should get the correct response to GET', async ({testApplicationUris}) => {

    const state = await hal2.get();
    expect(state.data).to.eql({title: 'HAL 2!'});


  });
  it('should be chainable', async ({testApplicationUris}) => {
    const serverUri = testApplicationUris.createTenantUri();
    const client = new Client(serverUri + '/hal1.json');

    const hal1 = await client.follow('next').follow('prev');
    const hal1State = await hal1.get();
    expect(hal1State.data).to.eql({title: 'Hal 1', foo: 'bar'});

  });

  it('should throw an error following non-existent relationships', async ({testApplicationUris}) => {

    const serverUri = testApplicationUris.createTenantUri();
    const client = new Client(serverUri + '/hal1.json');

    let result;
    try {
      const hal1 = await client.follow('next').follow('unknown');
      await hal1.get();
    } catch (e) {
      result = e;
    }

    expect(result).to.be.instanceof(Error);

  });

  it('should be chainable several times', async ({testApplicationUris}) => {

    const serverUri = testApplicationUris.createTenantUri();
    const client = new Client(serverUri + '/hal1.json');

    const hal1 = await client.follow('next').follow('prev').follow('next').follow('prev');
    const hal1State = await hal1.get();
    expect(hal1State.data).to.eql({title: 'Hal 1', foo: 'bar'});

  });

  it('should be chainable with a GET', async ({testApplicationUris}) => {

    const serverUri = testApplicationUris.createTenantUri();
    const client = new Client(serverUri + '/hal1.json');

    const hal1State = await client.follow('next').follow('prev').follow('next').follow('prev').get();
    expect(hal1State.data).to.eql({title: 'Hal 1', foo: 'bar'});

  });

  describe('followAll', () => {
    it('should work with embedded resources', async ({testApplicationUris}) => {

      const serverUri = testApplicationUris.createTenantUri();
      const client = new Client(serverUri + '/hal1.json');

      const items = await client.follow('collection').followAll('item');
      expect(items).to.have.length(2);
      expect(items[0]).to.be.an.instanceof(Resource);
      expect(items[1]).to.be.an.instanceof(Resource);

    });

    it('should be chainable to embedded states', async ({testApplicationUris}) => {

      const serverUri = testApplicationUris.createTenantUri();
      const client = new Client(serverUri + '/hal1.json');

      const items = await client.follow('collection').followAll('item').get();
      expect(items).to.have.length(2);
      expect(isState(items[0])).to.eq(true);
      expect(isState(items[1])).to.eq(true);

    });

    it('should remember the type="" property for later usage', async ({testApplicationUris}) => {

      const serverUri = testApplicationUris.createTenantUri();
      const client = new Client(serverUri + '/hal1.json');

      const newResource = await client.follow('self').followAll('content-type-link');
      expect(newResource[0]).to.be.an.instanceof(Resource);

    });

  });
});
