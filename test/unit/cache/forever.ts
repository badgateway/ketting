import { expect } from 'chai';
import { Client, ForeverCache, BaseState, Links } from '../../../src';

describe('ForeverCache', () => {

  it('should store and retrieve State objects', () => {

    const foreverCache = new ForeverCache();
    const state = new BaseState({
      client: new Client('http://example/'),
      uri: 'http://example/foo',
      data: 'hi',
      headers: new Headers(),
      links: new Links('http://example/foo')
    });
    foreverCache.store(state);

    expect(foreverCache.has('http://example/foo')).to.equal(true);

    const ts = Date.now();
    // We're resetting the timestamps so they dont drift during
    // cloning
    state.timestamp = ts;

    const newState = foreverCache.get('http://example/foo')!;
    newState.timestamp = ts;

    // Note we use .eql
    expect(newState).to.eql(state);

  });

  it('should clone objects, not store the original', () => {

    const foreverCache = new ForeverCache();
    const state = new BaseState({
      client: new Client('http://example/'),
      uri: 'http://example/foo',
      data: 'hi',
      headers: new Headers(),
      links: new Links('http://example/foo')
    });
    foreverCache.store(state);

    const ts = Date.now();
    // We're resetting the timestamps so they dont drift during
    // cloning
    state.timestamp = ts;

    const newState = foreverCache.get('http://example/foo')!;
    newState.timestamp = ts;

    // Note we use .equal, and not .eql. They check for different things.
    expect(newState).to.not.equal(state);

  });

  it('should allow items to be deleted', () => {

    const foreverCache = new ForeverCache();
    const state = new BaseState({
      client: new Client('http://example/'),
      uri: 'http://example/foo',
      data: 'hi',
      headers: new Headers(),
      links: new Links('http://example/foo')
    });
    foreverCache.store(state);
    foreverCache.delete('http://example/foo');

    expect(foreverCache.has('http://example/foo')).to.equal(false);

    const newState = foreverCache.get('http://example/foo');

    // Note we use .eql
    expect(newState).to.eql(null);

  });

  it('clear() should work', () => {

    const foreverCache = new ForeverCache();
    const state = new BaseState({
      client: new Client('http://example/'),
      uri: 'http://example/foo',
      data: 'hi',
      headers: new Headers(),
      links: new Links('http://example/foo')
    });
    foreverCache.store(state);
    foreverCache.clear();

    const newState = foreverCache.get('http://example/foo');

    // Note we use .eql
    expect(newState).to.eql(null);

  });

});
