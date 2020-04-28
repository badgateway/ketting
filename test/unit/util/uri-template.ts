import { expect } from 'chai';
import { expand } from '../../../src/util/uri-template';

describe('uri-template utility', () => {

  it('should be able to expand templated links from a Link object', () => {

    const link = {
      context: 'http://example.org/',
      href: '/foo/{bar}',
      rel: 'about',
      templated: true
    };

    expect(expand(link, { bar: 'zim' })).to.equal('http://example.org/foo/zim');

  });

  it('should not error when expanding non-templated links', () => {

    const link = {
      context: 'http://example.org/',
      href: '/foo/bar',
      rel: 'about',
    };

    expect(expand(link, { bar: 'zim' })).to.equal('http://example.org/foo/bar');

  });

});
