import { expect } from 'chai';
import { NeverCache, TextState, Links } from '../../../src';

describe('NeverCache', () => {

  it('should discard anything thats stored', () => {

    const neverCache = new NeverCache();
    const state = new TextState('http://example/foo','hi', new Headers(), new Links('http://example/foo'));
    neverCache.store(state);

    expect(neverCache.has('http://example/foo')).to.equal(false);

    const newState = neverCache.get('http://example/foo');
    expect(newState).to.eql(null);

  });

  it('should do nothing when calling delete', () => {

    const neverCache = new NeverCache();
    const state = new TextState('http://example/foo','hi', new Headers(), new Links('http://example/foo'));
    neverCache.store(state);
    neverCache.delete('http://example/foo');

    expect(neverCache.has('http://example/foo')).to.equal(false);

  });

  it('clear() should also not really have an effect', () => {

    const neverCache = new NeverCache();
    const state = new TextState('http://example/foo','hi', new Headers(), new Links('http://example/foo'));
    neverCache.store(state);
    neverCache.clear();
    const newState = neverCache.get('http://example/foo');

    // Note we use .eql
    expect(newState).to.eql(null);

  });

});
