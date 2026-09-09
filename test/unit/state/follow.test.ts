import { describe, it, expect } from '#ketting-test';

import { factory } from '#ketting-dist/state/hal.js';
import { Client, LinkNotFound, type State } from 'ketting';

describe('State.follow()', () => {

  it('should return a Resource for an existing link', async () => {

    const state = await halState({
      _links: {
        identity: { href: '/identity' },
      },
    });
    const resource = state.follow('identity');
    expect(resource.uri).to.equal('http://example/identity');

  });

  it('should throw LinkNotFound for a missing link', async () => {

    const state = await halState({});
    expect(() => state.follow('identity')).to.throw(LinkNotFound);

  });

});

describe('State.mayFollow()', () => {

  it('should return a Resource for an existing link', async () => {

    const state = await halState({
      _links: {
        identity: { href: '/identity' },
      },
    });
    const resource = state.mayFollow('identity');
    expect(resource?.uri).to.equal('http://example/identity');

  });

  it('should return undefined for a missing link', async () => {

    const state = await halState({});
    expect(state.mayFollow('identity')).to.equal(undefined);

  });

  it('should expand templated links', async () => {

    const state = await halState({
      _links: {
        search: { href: '/search{?q}', templated: true },
      },
    });
    const resource = state.mayFollow('search', { q: 'foo' });
    expect(resource?.uri).to.equal('http://example/search?q=foo');

  });

  it('should allow optional chaining into get()', async () => {

    const state = await halState({});
    const result = await state.mayFollow('identity')?.get();
    expect(result).to.equal(undefined);

  });

});

function halState(body: any): Promise<State> {

  const response = new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/hal+json' },
  });
  return factory(new Client('http://example/'), '/foo.json', response);

}
