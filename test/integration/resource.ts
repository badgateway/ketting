import {expect} from 'chai';
import {Ketting, NeverCache} from '../../src';

describe('Using resources', async () => {
  const ketting = new Ketting('http://localhost:3000/hal1.json');

  it('concurrent get on the same resource should do 2 distinct HTTP calls if request headers are different', async () => {
    ketting.cache = new NeverCache();

    const resource = await ketting.follow('collection');

    const [firstState, secondState] =
      await Promise.all([
        resource.get({headers: {'delay-in-ms': '2', 'foo': 'bar'}}),
        resource.get({headers: {'foo': 'baz'}})
      ]);

    expect(firstState.timestamp).to.not.eql(secondState.timestamp);
  });

  it('concurrent get on the same resource should produce only one HTTP call if request headers are the same', async () => {
    ketting.cache = new NeverCache();

    const resource = await ketting.follow('collection');

    const headers = new Headers({'foo': 'baz'});
    headers.append('foo', 'bar');
    const headers2 = new Headers({'foo': 'bar'});
    headers2.append('foo', 'baz');

    const [firstState, secondState] =
      await Promise.all([
        resource.get({headers: headers}),
        resource.get({headers: headers2})
      ]);

    expect(firstState.timestamp).to.eql(secondState.timestamp);
  });
});
