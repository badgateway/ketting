const Ketting = require('../../lib/ketting');
const Html = require('../../lib/representor/html');
const Hal = require('../../lib/representor/hal');
const expect = require('chai').expect;

describe('Ketting', () => {

  it('should return a HTML representor when requested', () => {

    const ketting = new Ketting();
    const representor = ketting.getRepresentor('text/html');
    expect(representor).to.eql(Html);

  });

  it('should return a Hal representor when requested', () => {

    const ketting = new Ketting();
    const representor = ketting.getRepresentor('application/hal+json');
    expect(representor).to.eql(Hal);

  });

  it('should throw an error when an unknown representor was requested ', () => {

    const ketting = new Ketting();
    expect( () => ketting.getRepresentor('text/plain') ).to.throw(Error);

  });

  it('should throw an error an a representor was incorrecly configured ', () => {

    const ketting = new Ketting();
    ketting.contentTypes.push({
      mime: 'text/plain',
      representor: 'bla-bla'
    });
    expect( () => ketting.getRepresentor('text/plain') ).to.throw(Error);

  });


});
