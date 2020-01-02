import { expect } from 'chai';

import Link from '../../src/link';

describe('Link', () => {

  it('should construct and expose its properties', () => {

    const link = new Link({
      context: 'http://example.org/',
      href: '/foo/bar',
      rel: 'foo',

      name: 'foo-link',
      type: 'text/css',
      templated: false,
      title: 'Foo Link',
    });

    expect(link.rel).to.equal('foo');
    expect(link.context).to.equal('http://example.org/');
    expect(link.href).to.equal('/foo/bar');
    expect(link.type).to.equal('text/css');
    expect(link.templated).to.equal(false);
    expect(link.title).to.equal('Foo Link');
    expect(link.name).to.equal('foo-link');

  });

  it('should be able to resolve relative links', () => {

    const link = new Link({
      rel: 'about',
      context: 'http://example.org/',
      href: '/foo/bar'
    });

    expect(link.resolve()).to.equal('http://example.org/foo/bar');

  });

  it('should be able to expand templated links', () => {

    const link = new Link({
      context: 'http://example.org/',
      href: '/foo/{bar}',
      rel: 'about',
      templated: true
    });

    expect(link.expand({ bar: 'zim' })).to.equal('http://example.org/foo/zim');

  });

  describe('templated links', () => {

    const tests:any = [
      ['/foo/{bar}', { bar: 'zim' }, 'http://example.org/foo/zim'],
      ['/foo{?q}{?order}{?age}', { q: '', order: 'createdAt DESC', age: 'P-1D'}, 'http://example.org/foo?q=&order=createdAt%20DESC&age=P-1D'],
    ];

    for(const test of tests) {
      it(`should expand ${test[0]} to ${test[2]}`, () => {

        const link = new Link({
          context: 'http://example.org/',
          href: test[0],
          rel: 'about',
          templated: true
        });

        expect(link.expand(test[1])).to.equal(test[2]);


      });
    }

  });

  it('should not error when expanding non-templated links', () => {

    const link = new Link({
      context: 'http://example.org/',
      href: '/foo/bar',
      rel: 'about',
    });

    expect(link.expand({ bar: 'zim' })).to.equal('http://example.org/foo/bar');

  });

});
