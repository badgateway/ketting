const Client = require('../../lib/client');
const Html = require('../../lib/representor/html');
const Hal = require('../../lib/representor/hal');
const expect = require('chai').expect;

describe('Client', () => {

  it('should return a HTML representor when requested', () => {

    const client = new Client();
    const representor = client.getRepresentor('text/html');
    expect(representor).to.eql(Html);

  });

  it('should return a Hal representor when requested', () => {

    const client = new Client();
    const representor = client.getRepresentor('application/hal+json');
    expect(representor).to.eql(Hal);

  });

  it('should throw an error when an unknown representor was requested ', () => {

    const client = new Client();
    expect( () => client.getRepresentor('text/plain') ).to.throw(Error);

  });

  it('should throw an error an a representor was incorrecly configured ', () => {

    const client = new Client();
    client.contentTypes.push({
      mime: 'text/plain',
      representor: 'bla-bla'
    });
    expect( () => client.getRepresentor('text/plain') ).to.throw(Error);

  });

});
