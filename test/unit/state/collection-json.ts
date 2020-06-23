import { expect } from 'chai';
import { CjState } from '../../../src';
import { factory } from '../../../src/state/collection-json';

describe('collection+json representor', () => {

  it('should parse the "Minimal Representation" example',  async() => {

    const exampleObj = { 'collection' :
      {
        'version' : '1.0',

        'href' : 'http://example.org/friends/'
      }
    };


    const cj = await callFactory('http://example.org/friends/', exampleObj);

    /*
    const cj = new CollectionJson(
      'http://example.org/friends/',
      'application/vnd.collection+json',
      JSON.stringify(exampleObj),
      new Map()
    );
     */
    expect(cj.links.getAll()).to.eql([]);

  });

  it('should parse the "Collection Representation" example', async () => {

    const exampleObj = { 'collection' :
      {
        'version' : '1.0',
        'href' : 'http://example.org/friends/',

        'links' : [
          {'rel' : 'feed', 'href' : 'http://example.org/friends/rss'}
        ],

        'items' : [
          {
            'href' : 'http://example.org/friends/jdoe',
            'data' : [
              {'name' : 'full-name', 'value' : 'J. Doe', 'prompt' : 'Full Name'},
              {'name' : 'email', 'value' : 'jdoe@example.org', 'prompt' : 'Email'}
            ],
            'links' : [
              {'rel' : 'blog', 'href' : 'http://examples.org/blogs/jdoe', 'prompt' : 'Blog'},
              {'rel' : 'avatar', 'href' : 'http://examples.org/images/jdoe', 'prompt' : 'Avatar', 'render' : 'image'}
            ]
          },

          {
            'href' : 'http://example.org/friends/msmith',
            'data' : [
              {'name' : 'full-name', 'value' : 'M. Smith', 'prompt' : 'Full Name'},
              {'name' : 'email', 'value' : 'msmith@example.org', 'prompt' : 'Email'}
            ],
            'links' : [
              {'rel' : 'blog', 'href' : 'http://examples.org/blogs/msmith', 'prompt' : 'Blog'},
              {'rel' : 'avatar', 'href' : 'http://examples.org/images/msmith', 'prompt' : 'Avatar', 'render' : 'image'}
            ]
          },

          {
            'href' : 'http://example.org/friends/rwilliams',
            'data' : [
              {'name' : 'full-name', 'value' : 'R. Williams', 'prompt' : 'Full Name'},
              {'name' : 'email', 'value' : 'rwilliams@example.org', 'prompt' : 'Email'}
            ],
            'links' : [
              {'rel' : 'blog', 'href' : 'http://examples.org/blogs/rwilliams', 'prompt' : 'Blog'},
              {'rel' : 'avatar', 'href' : 'http://examples.org/images/rwilliams', 'prompt' : 'Avatar', 'render' : 'image'}
            ]
          }
        ],

        'queries' : [
          {'rel' : 'search', 'href' : 'http://example.org/friends/search', 'prompt' : 'Search',
            'data' : [
              {'name' : 'search', 'value' : ''}
            ]
          },
          {'rel' : 'get-new', 'href' : 'http://example.org/friends/new', 'prompt' : 'New friends' },
        ],

        'template' : {
          'data' : [
            {'name' : 'full-name', 'value' : '', 'prompt' : 'Full Name'},
            {'name' : 'email', 'value' : '', 'prompt' : 'Email'},
            {'name' : 'blog', 'value' : '', 'prompt' : 'Blog'},
            {'name' : 'avatar', 'value' : '', 'prompt' : 'Avatar'}

          ]
        }
      }
    };

    const cj = await callFactory('http://example.org/friends/', exampleObj);
    /*
    const cj = new CollectionJson(
      'http://example.org/friends/',
      'application/vnd.collection+json',
      JSON.stringify(exampleObj),
      new Map()
    );
     */
    expect(cj.links.getAll()).to.eql([
      {
        rel: 'feed',
        href: 'http://example.org/friends/rss',
        context: 'http://example.org/friends/',
        title: undefined,
      },
      {
        rel: 'item',
        href: 'http://example.org/friends/jdoe',
        context: 'http://example.org/friends/',
      },
      {
        rel: 'item',
        href: 'http://example.org/friends/msmith',
        context: 'http://example.org/friends/',
      },
      {
        rel: 'item',
        href: 'http://example.org/friends/rwilliams',
        context: 'http://example.org/friends/',
      },
      {
        rel: 'search',
        href: 'http://example.org/friends/search{?search}',
        templated: true,
        context: 'http://example.org/friends/',
        title: undefined,
      },
      {
        rel: 'get-new',
        href: 'http://example.org/friends/new',
        context: 'http://example.org/friends/',
        title: undefined,
      },
    ]);

  });

  it('should correctly handle edge-cases', async () => {

    const exampleObj = { 'collection' :
      {
        'version' : '1.0',
        'href' : 'http://example.org/friends/',
        'items' : [
          {
            'data' : [
              {'name' : 'full-name', 'value' : 'J. Doe', 'prompt' : 'Full Name'},
              {'name' : 'email', 'value' : 'jdoe@example.org', 'prompt' : 'Email'}
            ],
            'links' : [
              {'rel' : 'blog', 'href' : 'http://examples.org/blogs/jdoe', 'prompt' : 'Blog'},
              {'rel' : 'avatar', 'href' : 'http://examples.org/images/jdoe', 'prompt' : 'Avatar', 'render' : 'image'}
            ]
          },
        ],
      }
    };

    const cj = await callFactory('http://example.org/friends/', exampleObj);
    /*
    const cj = new CollectionJson(
      'http://example.org/friends/',
      'application/vnd.collection+json',
      JSON.stringify(exampleObj),
      new Map()
    );
     */
    expect(cj.links.getAll()).to.eql([]);

  });
});

function callFactory(uri: string, body: any): Promise<CjState> {

  const response = new Response(JSON.stringify(body));
  return factory(uri, response);

}
