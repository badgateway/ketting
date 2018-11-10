import { expect } from 'chai';
import Ketting from '../../src/ketting';
import Link from '../../src/link';
import Resource from '../../src/resource';

describe('Issuing a GET request', async () => {

  const ketting = new Ketting('http://localhost:3000/hal1.json');
  let resource: Resource;
  let result: any;

  before( async () => {

    resource = await ketting.follow('headerTest');

  });

  it('should not fail', async () => {

    result = await resource.get();

  });

  it('should have sent the correct headers', async () => {

    expect(result).to.have.property('user-agent');
    expect(result['user-agent']).to.match(/^Ketting\//);
    expect(result.accept).to.eql('application/hal+json;q=1.0, application/json;q=0.9, text/html;q=0.8');

  });

  it('should throw an exception when there was a HTTP error', async () => {

    const resource2 = await ketting.follow('error400');
    let exception;
    try {
        await resource2.get();
    } catch (ex) {
        exception = ex;
    }
    expect(exception.response.status).to.equal(400);

  });

  it('should support the HTTP Link header', async () => {

    const resource2 = await ketting.follow('linkHeader');
    const links = await resource2.links();

    const expected = [
      new Link({
        rel: 'next',
        baseHref: 'http://localhost:3000/link-header',
        href: '/hal2.json'
      }),
      new Link({
        rel: 'previous',
        baseHref: 'http://localhost:3000/link-header',
        href: '/TheBook/chapter2'
      }),
      new Link({
        rel: 'start',
        baseHref: 'http://localhost:3000/link-header',
        href: 'http://example.org/'
      }),
      new Link({
        rel: 'http://example.net/relation/other',
        baseHref: 'http://localhost:3000/link-header',
        href: 'http://example.org/'
      })
    ];

    expect(links).to.eql(expected);

  });

  it('should support the HTTP Link header anchors', async () => {

    const resource2 = await ketting.follow('linkHeader');
    const anchoredLinks = await resource2.links('author', '#article-1');

    expect(anchoredLinks).to.eql([
      new Link({
        rel: 'author',
        baseHref: 'http://localhost:3000/link-header#article-1',
        href: '/users/jane-doe'
      }),
    ]);

    const thirdPartyLinks = await resource2.links('author', 'http://third-party.org/');

    expect(thirdPartyLinks).to.eql([
      new Link({
        rel: 'author',
        baseHref: 'http://third-party.org/',
        href: '/users/john-doe'
      }),
    ]);

  });

  it('should throw an exception when no content-type was returned', async () => {

    const resource2 = await ketting.follow('no-content-type');
    let hadException = false;
    try {
      await resource2.get();
    } catch (ex) {
      hadException = true;
    }
    expect(hadException).to.eql(true);

  });
});
