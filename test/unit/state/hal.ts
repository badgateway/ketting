import { expect } from 'chai';
import { HalState } from '../../../src';
import { factory } from '../../../src/state/hal';

describe('HAL representor', () => {

  it('should parse a HAL document', async () => {

    const hal = await callFactory({
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

    expect(hal.links.getAll()).to.eql([
      {
        href: 'https://evertpot.com/',
        context: 'http://example/',
        rel: 'author',
      },
      {
        href: '/bar',
        context: 'http://example/',
        rel: 'foo',
      },
    ]);

    const embedded = hal.getEmbedded()[0];

    expect(embedded.uri).to.eql('http://example/bar');
    expect(embedded.body).to.eql({hello: 'world'});
    expect(embedded.links.has('self')).to.eql(true);


    expect(hal.body).to.eql({ happy: 2020 });

  });

  it('should ignore _embedded items without a "self" link', async () => {

    const hal = await callFactory({
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

    expect(hal.links.getAll()).to.eql([
      {
        href: 'https://evertpot.com/',
        context: 'http://example/',
        rel: 'author',
      },
      {
        href: '/bar',
        context: 'http://example/',
        rel: 'foo',
      },
    ]);

    expect(hal.getEmbedded()).to.eql([]);

  });

  it('should parse _embedded and _links encoded as an array', async () => {

    const hal = await callFactory({
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

    expect(hal.links.getAll()).to.eql([
      {
        href: 'https://evertpot.com/',
        context: 'http://example/',
        rel: 'author',
      },
      {
        href: '/bar',
        context: 'http://example/',
        rel: 'foo',
      },
    ]);

  });

  it('should expose embedded items as links, even if they don\'t exist in the links object.', async () => {

    const hal = await callFactory({
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

    expect(hal.links.getAll()).to.eql([
      {
        href: 'https://evertpot.com/',
        context: 'http://example/',
        rel: 'author',
      },
      {
        href: '/bar',
        context: 'http://example/',
        rel: 'foo',
      },
    ]);

    const embedded = hal.getEmbedded()[0];

    expect(embedded.uri).to.eql('http://example/bar');
    expect(embedded.body).to.eql({hello: 'world'});
    expect(embedded.links.has('self')).to.eql(true);

  });

  it('It should not break when _links is missing', async () => {

    const hal = await callFactory({});

    expect(hal.links.getAll()).to.eql([]);
    expect(hal.getEmbedded()).to.eql([]);

  });
});

function callFactory(body: any, url = 'http://example/'): Promise<HalState> {

  const response = new Response(JSON.stringify(body));
  return factory(url, response);

}
