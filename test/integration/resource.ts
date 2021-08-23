import {expect} from 'chai';
import {Ketting, NeverCache} from '../../src';

describe('Resource', async () => {
  const ketting = new Ketting('http://localhost:3000/hal1.json');

  it('should do 2 distinct HTTP calls if request headers are different on concurrent calls', async () => {
    ketting.cache = new NeverCache();

    const resource = await ketting.follow('collection');

    const [firstState, secondState] =
      await Promise.all([
        resource.get({headers: {'delay-in-ms': '2', 'prefer': 'return=minimal'}}),
        resource.get({headers: {'delay-in-ms': '2', 'prefer': 'return=representation'}})
      ]);
    expect(firstState.headers.get('preference-applied')).to.eql('return=minimal');
    expect(secondState.headers.get('preference-applied')).to.eql('return=representation');
    expect(firstState.headers.get('response-id')).to.not.eql(secondState.headers.get('response-id'));
  });

  it('should produce only one HTTP call if request headers are the same on concurrent calls', async () => {
    ketting.cache = new NeverCache();

    const resource = await ketting.follow('collection');

    const headers1 = new Headers();
    headers1.append('prefer', 'return=minimal');
    headers1.append('prefer', 'return=representation');
    headers1.append('delay-in-ms', '2');
    const headers2 = new Headers();
    headers2.append('prefer', 'return=minimal');
    headers2.append('prefer', 'return=representation');
    headers2.append('delay-in-ms', '2');

    const [firstState, secondState] =
      await Promise.all([
        resource.get({headers: headers1}),
        resource.get({headers: headers2})
      ]);

    expect(firstState.headers.get('response-id')).to.eql(secondState.headers.get('response-id'));
  });
});
