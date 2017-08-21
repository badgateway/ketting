const Html = require('../../../lib/representor/html');
const Link = require('../../../lib/link');
const expect = require('chai').expect;

describe('HTML representor', () => {

  const tests = [
    [
      `<link rel="me" href="https://evertpot.com/" />`,
      new Link({rel: 'me', baseHref: '/index.html', href: 'https://evertpot.com/'})
    ],
    [
      `<link rel="me" href="https://evertpot.com/">`,
      new Link({rel: 'me', baseHref: '/index.html', href: 'https://evertpot.com/'})
    ],
    [
      `<LINK rel="me" href="https://evertpot.com/">`,
      new Link({rel: 'me', baseHref: '/index.html', href: 'https://evertpot.com/'})
    ],
    [
      `<link REL="me" href="https://evertpot.com/">`,
      new Link({rel: 'me', baseHref: '/index.html', href: 'https://evertpot.com/'})
    ],
    [
      `<link href="https://evertpot.com/" rel="me" />`,
      new Link({rel: 'me', baseHref: '/index.html', href: 'https://evertpot.com/'})
    ],
    [
      `<link href="https://evertpot.com/" rel="me" title="my website!"/>`,
      new Link({rel: 'me', baseHref: '/index.html', href: 'https://evertpot.com/'})
    ],
    [
      `<link href="foo.css" rel="stylesheet" type="text/css" />`,
      new Link({rel: 'stylesheet', baseHref: '/index.html', href: 'foo.css', type: 'text/css'})
    ],
    [
      `<a href="https://evertpot.com/" rel="me">`,
      new Link({rel: 'me', baseHref: '/index.html', href: 'https://evertpot.com/'})
    ],
    [
      `<A href="https://evertpot.com/" rel="me">`,
      new Link({rel: 'me', baseHref: '/index.html', href: 'https://evertpot.com/'})
    ],
    [
      `<a HREF="https://evertpot.com/" rel="me">`,
      new Link({rel: 'me', baseHref: '/index.html', href: 'https://evertpot.com/'})
    ],
    [
      `<a rel="me" href="https://evertpot.com/">`,
      new Link({rel: 'me', baseHref: '/index.html', href: 'https://evertpot.com/'})
    ],
    [
      `<a rel="icon favicon" href="favicon.ico">`,
      new Link({rel: 'icon', baseHref: '/index.html', href: 'favicon.ico'}),
      new Link({rel: 'favicon', baseHref: '/index.html', href: 'favicon.ico'}),
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
