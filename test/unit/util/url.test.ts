import { describe, it, expect } from '#ketting-test';

import { resolve, parse } from '#ketting-dist/util/uri.js';

describe('Uri utility', () => {

  describe('resolve', () => {

    it('should be able to resolve relative links from a Link object', () => {

      const link = {
        rel: 'about',
        context: 'http://example.org/',
        href: '/foo/bar'
      };

      expect(resolve(link)).to.equal('http://example.org/foo/bar');

    });
    it('should be able to resolve relative links strings', () => {

      const base = 'http://example.org/';
      const relative = '/foo/bar';

      expect(resolve(base, relative)).to.equal('http://example.org/foo/bar');

    });
  });

  describe('parse', () => {

    it('should be able to parse a uri', () => {

      const parsed = parse('http://example.org/foo/bar');
      expect(parsed.host).to.equal('example.org');

    });

  });

});
