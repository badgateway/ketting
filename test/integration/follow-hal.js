const Ketting = require('../../lib/ketting');
const Resource = require('../../lib/resource');
const expect = require('chai').expect;

describe('Following a link', async () => {

  const ketting = new Ketting('http://localhost:3000/hal1.json');

  let hal2;

  it('should return a resource', async() => {
  
    hal2 = await ketting.follow('next');
    expect(hal2).to.be.an.instanceof(Resource);

  
  });
  it('should get the correct response to GET', async() => {
  
    const body = await hal2.get();
    expect(body).to.eql({'title': 'HAL 2!'});
    

  });
  it('should be chainable', async() => {

    const hal1 = await ketting.follow('next').follow('prev');
    const body = await hal1.get();
    expect(body).to.eql({'title': 'Hal 1', 'foo': 'bar'});

  });

  it('should work with embedded resources', async() => {

    const items = await ketting.follow('collection').followAll('item');
    expect(items).to.have.length(2);
    expect(items[0]).to.be.an.instanceof(Resource);
    expect(items[1]).to.be.an.instanceof(Resource);

  });

});
