import Hal from '../../../src/representor/hal';
import Link from '../../../src/link';
import { expect } from 'chai';

describe('HAL representor', () => {

  it('should parse a HAL document', () => {

    const hal = parse({
      _links: {
        author: {
          href: 'https://evertpot.com/',
        },
        foo: {
          href: '/bar',
        }
      },
      _embedded: {
        foo: {
          _links: {
            self: {
              href: '/bar',
            }
          },
          hello: 'world',
        }
      },
      happy: 2020,
    });

    expect(hal.getLinks()).to.eql([
      new Link({
        href: 'https://evertpot.com/',
        context: 'http://example/',
        rel: 'author',
      }),
      new Link({
        href: '/bar',
        context: 'http://example/',
        rel: 'foo',
      }),
    ]);

    expect(hal.getEmbedded()).to.eql({
      'http://example/bar': {
        _links: {
          self: { href: '/bar' },
        },
        hello: 'world',
      }
    });

    expect(hal.getBody()).to.eql({ happy: 2020 });

  });

  it('should ignore _embedded items without a "self" link', () => {

    const hal = parse({
      _links: {
        author: {
          href: 'https://evertpot.com/',
        },
        foo: {
          href: '/bar',
        }
      },
      _embedded: {
        foo: {
          _links: {
            smell: {
              href: '/bar',
            }
          },
          hello: 'world',
        }
      }
    });

    expect(hal.getLinks()).to.eql([
      new Link({
        href: 'https://evertpot.com/',
        context: 'http://example/',
        rel: 'author',
      }),
      new Link({
        href: '/bar',
        context: 'http://example/',
        rel: 'foo',
      }),
    ]);

    expect(hal.getEmbedded()).to.eql({});

  });

  it('should parse _embedded and _links encoded as an array', () => {

    const hal = parse({
      _links: {
        author: {
          href: 'https://evertpot.com/',
        },
        foo: [{
          href: '/bar',
        }]
      },
      _embedded: {
        foo: [{
          _links: {
            self: {
              href: '/bar',
            }
          },
          hello: 'world',
        }]
      }
    });

    expect(hal.getLinks()).to.eql([
      new Link({
        href: 'https://evertpot.com/',
        context: 'http://example/',
        rel: 'author',
      }),
      new Link({
        href: '/bar',
        context: 'http://example/',
        rel: 'foo',
      }),
    ]);

    expect(hal.getLinks()).to.eql([
      new Link({
        href: 'https://evertpot.com/',
        context: 'http://example/',
        rel: 'author',
      }),
      new Link({
        href: '/bar',
        context: 'http://example/',
        rel: 'foo',
      }),
    ]);

  });

  it('should expose embedded items as links, even if they don\'t exist in the links object.', () => {

    const hal = parse({
      _links: {
        author: {
          href: 'https://evertpot.com/',
        },
      },
      _embedded: {
        foo: {
          _links: {
            self: {
              href: '/bar',
            }
          },
          hello: 'world',
        }
      }
    });

    expect(hal.getLinks()).to.eql([
      new Link({
        href: 'https://evertpot.com/',
        context: 'http://example/',
        rel: 'author',
      }),
      new Link({
        href: '/bar',
        context: 'http://example/',
        rel: 'foo',
      }),
    ]);

    expect(hal.getEmbedded()).to.eql({
      'http://example/bar': {
        _links: {
          self: { href: '/bar' },
        },
        hello: 'world',
      }
    });

  });

  it('It should not break when _links is missing', () => {

    const hal = parse({});

    expect(hal.getLinks()).to.eql([]);
    expect(hal.getEmbedded()).to.eql({});

  });
});


function parse(input: any): Hal {

  return new Hal(
    'http://example/',
    'application/hal+json',
    JSON.stringify(input),
    new Map(),
  );

}
