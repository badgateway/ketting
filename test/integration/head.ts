import { describe, it, before } from 'node:test';
import testServer from '../testserver';

import { expect } from 'chai';
import { Ketting, Link, Resource } from '../../src';

describe('Issuing a HEAD request', async () => {

  const serverUri = testServer();
  const ketting = new Ketting(serverUri + '/hal1.json');
  let resource: Resource;

  before( async () => {

    resource = await ketting.follow('headerTest');

  });

  it('should not fail', async () => {

    await resource.head();

  });

  it('should throw an exception when there was a HTTP error', async () => {

    const resource2 = await ketting.follow('error400');
    let exception;
    try {
      await resource2.head();
    } catch (ex: any) {
      exception = ex;
    }
    expect(exception.response.status).to.equal(400);

  });

  it('should support the HTTP Link header', async () => {

    const resource2 = await ketting.follow('linkHeader');
    const links = (await resource2.head()).links.getAll();

    const expected:Link[] = [
      {
        rel: 'next',
        context: serverUri + '/link-header',
        href: '/hal2.json',
        hreflang: undefined,
        title: undefined,
        type: undefined,
      },
      {
        rel: 'previous',
        context: serverUri + '/link-header',
        href: '/TheBook/chapter2',
        hreflang: undefined,
        title: undefined,
        type: undefined,
      },
      {
        rel: 'start',
        context: serverUri + '/link-header',
        href: 'http://example.org/',
        hreflang: undefined,
        title: undefined,
        type: undefined,
      },
      {
        rel: 'http://example.net/relation/other',
        context: serverUri + '/link-header',
        href: 'http://example.org/',
        hreflang: undefined,
        title: undefined,
        type: undefined,
      }
    ];

    expect(links).to.eql(expected);

  });

});
