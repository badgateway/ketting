import { expect } from 'chai';
import { factory, fromJSON } from '../../../src/state/hal';
import { Client } from '../../../src';

describe('HAL state factory', () => {

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
    expect(embedded.data).to.eql({hello: 'world'});
    expect(embedded.links.has('self')).to.eql(true);


    expect(hal.data).to.eql({ happy: 2020 });

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
    expect(embedded.data).to.eql({hello: 'world'});
    expect(embedded.links.has('self')).to.eql(true);

  });

  it('It should not break when _links is missing', async () => {

    const hal = await callFactory({});

    expect(hal.links.getAll()).to.eql([]);
    expect(hal.getEmbedded()).to.eql([]);

  });

  it('should correctly reserialize HAL documents', async() => {

    const hal = await callFactory({
      _links: {
        self: {
          href: '/foo',
        },
        author: {
          href: 'https://evertpot.com/',
        },
        foo: [
          {
            href: '/bar',
          },
          {
            href: '/bar2',
          },
          {
            href: '/bar3',
          },
        ]
      },
      happy: 2020,
    });

    const result = JSON.parse(hal.serializeBody() as any);
    expect(result).to.eql({
      _links: {
        self: {
          href: 'http://example/',
        },
        author: {
          href: 'https://evertpot.com/',
        },
        foo: [
          {
            href: '/bar',
          },
          {
            href: '/bar2',
          },
          {
            href: '/bar3',
          },
        ]
      },
      happy: 2020,
    });

  });
  it('should correctly rebuild HAL documents', async() => {

    const base = {
      _links: {
        self: {
          href: '/foo',
        },
        author: {
          href: 'https://evertpot.com/',
        },
        foo: [
          {
            href: '/bar',
          },
          {
            href: '/bar2',
          },
          {
            href: '/bar3',
          },
        ]
      },
      happy: 2020,
    };
    const hal = await callFactory(base, base._links.self.href);
    // const json = (hal as HalState).toJSON();
    const json = hal.toJSON();
    const result = fromJSON(hal.client, json);
    expect(result.uri).to.eql(hal.uri);
    expect(JSON.parse(result.serializeBody())).to.eql(base);

  });
  it('should handle JSON documents that are arrays', async () => {

    const hal = await callFactory([
      1, 2, 3
    ]);

    expect(hal.links.getAll()).to.eql([]);
    expect(hal.data).to.eql([1, 2, 3]);

  });
  it('shouldnt die when _embedded is encoded as null', async () => {

    // this is probably technically invalid HAL, but we want to be somewhat robust.

    const hal = await callFactory({
      _embedded: null
    });

    expect(hal.links.getAll()).to.eql([]);

  });

  it('should support the "name" property', async () => {

    const hal = await callFactory({
      _links: {
        author: {
          href: 'https://evertpot.com/',
        },
        foo: {
          href: '/bar',
          name: 'WHATS-MY-NAME',
        }
      },
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
        name: 'WHATS-MY-NAME',
      },
    ]);

  });

});

function callFactory(body: any, url = 'http://example/') {

  const response = new Response(JSON.stringify(body));
  return factory(new Client(url), url, response);

}
