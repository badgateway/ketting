import { describe, it, before } from 'node:test';
import testServer from '../testserver';

import { expect } from 'chai';
import { Ketting, Link, Resource } from '../../src';

describe('Issuing a GET request', async () => {

  const serverUri = testServer();
  const ketting = new Ketting(serverUri + '/hal1.json');
  let resource: Resource;
  let result: any;

  before( async () => {

    resource = await ketting.follow('headerTest');

  });

  it('should not fail', async () => {

    result = await resource.get();

  });

  it('should have sent the correct headers', async () => {

    expect(result.data).to.have.property('user-agent');
    expect(result.data['user-agent']).to.match(/^Ketting\//);

    const mediaTypes = [
      'application/prs.hal-forms+json;q=1.0',
      'application/hal+json;q=0.9',
      'application/vnd.api+json;q=0.8',
      'application/vnd.siren+json;q=0.8',
      'application/vnd.collection+json;q=0.8',
      'application/json;q=0.7',
      'text/html;q=0.6',
    ];

    expect(result.data.accept).to.eql(mediaTypes.join(', '));

  });

  it('should throw an exception when there was a HTTP error', async () => {

    const resource2 = await ketting.follow('error400');
    let exception;
    try {
      await resource2.get();
    } catch (ex: any) {
      exception = ex;
    }
    expect(exception.response.status).to.equal(400);

  });

  it('should support the HTTP Link header', async () => {

    const resource2 = await ketting.follow('linkHeader');
    const links = await resource2.links();

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

  it('should successfully de-duplicate multiple parallel refreshes', async() => {

    const counterResource = await ketting.follow('counter');
    const [result1, result2] = await Promise.all([
      counterResource.refresh(),
      counterResource.refresh()
    ]);

    expect(result1).to.be.eql(result2);

  });

});
