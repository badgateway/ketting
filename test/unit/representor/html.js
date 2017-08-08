const Html = require('../../../lib/representor/html');
const Link = require('../../../lib/link');
const expect = require('chai').expect;

describe('HTML representor', () => {

  const tests = [
    [
      `<link rel="me" href="https://evertpot.com/" />`,
      new Link('me', '/index.html', 'https://evertpot.com/', null, false)
    ],
    [
      `<link rel="me" href="https://evertpot.com/">`,
      new Link('me', '/index.html', 'https://evertpot.com/', null, false)
    ],
    [
      `<LINK rel="me" href="https://evertpot.com/">`,
      new Link('me', '/index.html', 'https://evertpot.com/', null, false)
    ],
    [
      `<link REL="me" href="https://evertpot.com/">`,
      new Link('me', '/index.html', 'https://evertpot.com/', null, false)
    ],
    [
      `<link href="https://evertpot.com/" rel="me" />`,
      new Link('me', '/index.html', 'https://evertpot.com/', null, false)
    ],
    [
      `<link href="https://evertpot.com/" rel="me" title="my website!"/>`,
      new Link('me', '/index.html', 'https://evertpot.com/', null, false)
    ],
    [
      `<link href="foo.css" rel="stylesheet" type="text/css" />`,
      new Link('stylesheet', '/index.html', 'foo.css', 'text/css', false)
    ],
    [
      `<a href="https://evertpot.com/" rel="me">`,
      new Link('me', '/index.html', 'https://evertpot.com/', null, false)
    ],
    [
      `<A href="https://evertpot.com/" rel="me">`,
      new Link('me', '/index.html', 'https://evertpot.com/', null, false)
    ],
    [
      `<a HREF="https://evertpot.com/" rel="me">`,
      new Link('me', '/index.html', 'https://evertpot.com/', null, false)
    ],
    [
      `<a rel="me" href="https://evertpot.com/">`,
      new Link('me', '/index.html', 'https://evertpot.com/', null, false)
    ],
    [
      `<a rel="icon favicon" href="favicon.ico">`,
      new Link('icon', '/index.html', 'favicon.ico', null, false),
      new Link('favicon', '/index.html', 'favicon.ico', null, false),
    ]
  ];

  tests.forEach( value => {

    it('should parse ' + value[0], () => {

      const html = new Html('/index.html', 'text/html', value[0]);

      const links = [
        value[1]
      ];
      if (value[2]) {
        links.push(value[2]);
      }

      expect(html.uri).to.equal('/index.html');
      expect(html.contentType).to.equal('text/html');
      expect(html.links).to.eql(links);

    });

  });

});
