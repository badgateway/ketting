const Ketting = require('../../src/ketting').default;
const Resource = require('../../src/resource').default;
const expect = require('chai').expect;

describe('Following a templated link', async () => {

  const ketting = new Ketting('http://localhost:3000/hal1.json');

  let hal2;

  it('should have expanded the uri', async() => {

    hal2 = await ketting.follow('templated', {foo: 'bar'});
    expect(hal2).to.be.an.instanceof(Resource);
    expect(hal2.uri).to.eql('http://localhost:3000/templated.json?foo=bar');

  });

  it('should have expanded the uri after several follows', async() => {

    hal2= await ketting.follow('next').follow('prev').follow('templated', {foo: 'bar'});
    expect(hal2).to.be.an.instanceof(Resource);
    expect(hal2.uri).to.eql('http://localhost:3000/templated.json?foo=bar');

  });

});
