const Client = require('../../lib/client');
const Resource = require('../../lib/resource');
const expect = require('chai').expect;

describe('Following a templated link', async () => {

  const client = new Client('http://localhost:3000/hal1.json');

  let hal2;

  it('should have expanded the uri', async() => {
  
    hal2 = await client.follow('templated', {foo: 'bar'});
    expect(hal2).to.be.an.instanceof(Resource);
    expect(hal2.uri).to.eql('http://localhost:3000/templated.json?foo=bar');
  
  });

});
