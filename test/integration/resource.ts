import {expect} from 'chai';
import {Ketting, NeverCache} from '../../src';

describe('Resource', async () => {
  const ketting = new Ketting('http://localhost:3000/hal1.json');

  it('should do 2 distinct HTTP calls if request headers are different on concurrent calls', async () => {
    ketting.cache = new NeverCache();

    const resource = await ketting.follow('collection');

    const [firstState, secondState] =
      await Promise.all([
        resource.get({headers: {'delay-in-ms': '2', 'foo': 'bar'}}),
        resource.get({headers: {'delay-in-ms': '2', 'foo': 'baz'}})
      ]);

    expect(firstState.headers.get('response-id')).to.not.eql(secondState.headers.get('response-id'));
  });

  it('should produce only one HTTP call if request headers are the same on concurrent calls', async () => {
    ketting.cache = new NeverCache();

    const resource = await ketting.follow('collection');

    const headers1 = new Headers();
    headers1.append('foo', 'bar');
    headers1.append('foo', 'baz');
    headers1.append('delay-in-ms', '2');
    const headers2 = new Headers();
    headers2.append('foo', 'bar');
    headers2.append('foo', 'baz');
    headers2.append('delay-in-ms', '2');

    const [firstState, secondState] =
      await Promise.all([
        resource.get({headers: headers1}),
        resource.get({headers: headers2})
      ]);

    expect(firstState.headers.get('response-id')).to.eql(secondState.headers.get('response-id'));
  });
});
