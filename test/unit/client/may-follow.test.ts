import { describe, it, expect } from '#ketting-test';

import { Client } from 'ketting';

describe('Client.mayFollow()', () => {

  it('should resolve to a Resource for an existing link', async () => {

    const client = halClient({
      _links: {
        identity: { href: '/identity' },
      },
    });
    const resource = await client.mayFollow('identity');
    expect(resource?.uri).to.equal('https://example.org/identity');

  });

  it('should resolve to undefined for a missing link', async () => {

    const client = halClient({});
    expect(await client.mayFollow('identity')).to.equal(undefined);

  });

  it('should expand templated links', async () => {

    const client = halClient({
      _links: {
        search: { href: '/search{?q}', templated: true },
      },
    });
    const resource = await client.mayFollow('search', { q: 'foo' });
    expect(resource?.uri).to.equal('https://example.org/search?q=foo');

  });

});

const halClient = (body: any): Client => {

  const client = new Client('https://example.org/');
  client.use(async () => new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/hal+json' },
  }));
  return client;

};
