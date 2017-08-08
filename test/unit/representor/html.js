const Html = require('../../../lib/representor/html');
const Link = require('../../../lib/link');
const expect = require('chai').expect;

describe('HTML representor', () => {

  it('should parse a link tag', () => {

    const body = `
      <link rel="me" href="https://evertpot.com/" />
    `;

    const html = new Html('/index.html', 'text/html', body);
   
    expect(html.uri).to.equal('/index.html');
    expect(html.contentType).to.equal('text/html');
    expect(html.links).to.eql([
      new Link('me', '/index.html', 'https://evertpot.com/', null, false)
    ]);

  });

});
