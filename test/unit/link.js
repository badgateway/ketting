const Link = require('../../src/link');
const expect = require('chai').expect;

describe('Link', () => {

  it('should construct and expose its properties', () => {

    const link = new Link({
      rel: 'foo',
      baseHref: 'http://example.org/',
      href: '/foo/bar',
      type: 'text/css',
      templated: false,
      title: 'Foo Link',
      name: 'foo-link'
    });

    expect(link.rel).to.equal('foo');
    expect(link.baseHref).to.equal('http://example.org/');
    expect(link.href).to.equal('/foo/bar');
    expect(link.type).to.equal('text/css');
    expect(link.templated).to.equal(false);
    expect(link.title).to.equal('Foo Link');
    expect(link.name).to.equal('foo-link');

  });

  it('should be able to resolve relative links', () => {

    const link = new Link({
      baseHref: 'http://example.org/',
      href: '/foo/bar'
    });

    expect(link.resolve()).to.equal('http://example.org/foo/bar');

  });

  it('should be able to expand templated links', () => {

    const link = new Link({
      baseHref: 'http://example.org/',
      href: '/foo/{bar}',
      templated: true
    });

    expect(link.expand({ bar: 'zim' })).to.equal('http://example.org/foo/zim');

  });

  it('should not error when expanding non-templated links', () => {

    const link = new Link({
      baseHref: 'http://example.org/',
      href: '/foo/bar'
    });

    expect(link.expand({ bar: 'zim' })).to.equal('http://example.org/foo/bar');

  });

});
