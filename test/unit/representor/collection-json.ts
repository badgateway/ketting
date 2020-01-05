import { expect } from 'chai';
import Link from '../../../src/link';
import CollectionJson from '../../../src/representor/collection-json';

describe('collection+json representor', () => {

  it('should parse the "Minimal Representation" example', () => {

    const exampleObj = { "collection" :
      {
        "version" : "1.0",

        "href" : "http://example.org/friends/"
      }
    };

    const cj = new CollectionJson(
      'http://example.org/friends/',
      'application/vnd.collection+json',
      JSON.stringify(exampleObj),
      new Map()
    );
    expect(cj.getLinks()).to.eql([]);

  });

  it('should parse the "Collection Representation" example', () => {

    const exampleObj = { "collection" :
      {
        "version" : "1.0",
        "href" : "http://example.org/friends/",

        "links" : [
          {"rel" : "feed", "href" : "http://example.org/friends/rss"}
        ],

        "items" : [
          {
            "href" : "http://example.org/friends/jdoe",
            "data" : [
              {"name" : "full-name", "value" : "J. Doe", "prompt" : "Full Name"},
              {"name" : "email", "value" : "jdoe@example.org", "prompt" : "Email"}
            ],
            "links" : [
              {"rel" : "blog", "href" : "http://examples.org/blogs/jdoe", "prompt" : "Blog"},
              {"rel" : "avatar", "href" : "http://examples.org/images/jdoe", "prompt" : "Avatar", "render" : "image"}
            ]
          },

          {
            "href" : "http://example.org/friends/msmith",
            "data" : [
              {"name" : "full-name", "value" : "M. Smith", "prompt" : "Full Name"},
              {"name" : "email", "value" : "msmith@example.org", "prompt" : "Email"}
            ],
            "links" : [
              {"rel" : "blog", "href" : "http://examples.org/blogs/msmith", "prompt" : "Blog"},
              {"rel" : "avatar", "href" : "http://examples.org/images/msmith", "prompt" : "Avatar", "render" : "image"}
            ]
          },

          {
            "href" : "http://example.org/friends/rwilliams",
            "data" : [
              {"name" : "full-name", "value" : "R. Williams", "prompt" : "Full Name"},
              {"name" : "email", "value" : "rwilliams@example.org", "prompt" : "Email"}
            ],
            "links" : [
              {"rel" : "blog", "href" : "http://examples.org/blogs/rwilliams", "prompt" : "Blog"},
              {"rel" : "avatar", "href" : "http://examples.org/images/rwilliams", "prompt" : "Avatar", "render" : "image"}
            ]
          }
        ],

        "queries" : [
          {"rel" : "search", "href" : "http://example.org/friends/search", "prompt" : "Search",
            "data" : [
              {"name" : "search", "value" : ""}
            ]
          },
          {"rel" : "get-new", "href" : "http://example.org/friends/new", "prompt" : "New friends" },
        ],

        "template" : {
          "data" : [
            {"name" : "full-name", "value" : "", "prompt" : "Full Name"},
            {"name" : "email", "value" : "", "prompt" : "Email"},
            {"name" : "blog", "value" : "", "prompt" : "Blog"},
            {"name" : "avatar", "value" : "", "prompt" : "Avatar"}

          ]
        }
      }
    };

    const cj = new CollectionJson(
      'http://example.org/friends/',
      'application/vnd.collection+json',
      JSON.stringify(exampleObj),
      new Map()
    );
    expect(cj.getLinks()).to.eql([
      new Link({
        rel: 'feed',
        href: 'http://example.org/friends/rss',
        context: 'http://example.org/friends/',
      }),
      new Link({
        rel: 'item',
        href: 'http://example.org/friends/jdoe',
        context: 'http://example.org/friends/',
      }),
      new Link({
        rel: 'item',
        href: 'http://example.org/friends/msmith',
        context: 'http://example.org/friends/',
      }),
      new Link({
        rel: 'item',
        href: 'http://example.org/friends/rwilliams',
        context: 'http://example.org/friends/',
      }),
      new Link({
        rel: 'search',
        href: 'http://example.org/friends/search{?search}',
        templated: true,
        context: 'http://example.org/friends/',
      }),
      new Link({
        rel: 'get-new',
        href: 'http://example.org/friends/new',
        context: 'http://example.org/friends/',
      }),
    ]);

  });

  it('should correctly handle edge-cases', () => {

    const exampleObj = { "collection" :
      {
        "version" : "1.0",
        "href" : "http://example.org/friends/",
        "items" : [
          {
            "data" : [
              {"name" : "full-name", "value" : "J. Doe", "prompt" : "Full Name"},
              {"name" : "email", "value" : "jdoe@example.org", "prompt" : "Email"}
            ],
            "links" : [
              {"rel" : "blog", "href" : "http://examples.org/blogs/jdoe", "prompt" : "Blog"},
              {"rel" : "avatar", "href" : "http://examples.org/images/jdoe", "prompt" : "Avatar", "render" : "image"}
            ]
          },
        ],
      }
    };

    const cj = new CollectionJson(
      'http://example.org/friends/',
      'application/vnd.collection+json',
      JSON.stringify(exampleObj),
      new Map()
    );
    expect(cj.getLinks()).to.eql([]);

  });
});
