import {expect} from 'chai';
import {Ketting, NeverCache} from '../../src';

describe('Using resources', async () => {
  const ketting = new Ketting('http://localhost:3000/hal1.json');

  it('concurrent get on the same resource should do 2 distinct HTTP calls if allowMultipleParallelRefreshes is enabled', async () => {
    ketting.cache = new NeverCache();
    ketting.allowMultipleParallelRefreshes = true;

    const resource = await ketting.follow('collection');

    const [firstState, secondState] =
      await Promise.all([
        resource.get({headers: {'delay-in-ms': '2'}}),
        resource.get()
      ]);

    expect(firstState.timestamp).to.not.eql(secondState.timestamp);
  });

  it('concurrent get on the same resource should produce only one HTTP call if allowMultipleParallelRefreshes is disabled (backward compatibility)', async () => {
    ketting.cache = new NeverCache();
    ketting.allowMultipleParallelRefreshes = false;

    const resource = await ketting.follow('collection');

    const [firstState, secondState] =
      await Promise.all([
        resource.get({headers: {'delay-in-ms': '2'}}),
        resource.get()
      ]);

    expect(firstState.timestamp).to.eql(secondState.timestamp);
  });
});
