import {describe, it} from 'node:test';

import {expect} from 'chai';
import {Ketting, Resource} from '../../src/index.js';
import {createTenantUri} from '../test-application-uris.js';

describe('Following a templated link', async () => {

  const serverUri = createTenantUri();
  const ketting = new Ketting(serverUri + '/hal1.json');

  let hal2: Resource;

  it('should have expanded the uri', async () => {

    hal2 = await ketting.follow('templated', {foo: 'bar'});
    expect(hal2).to.be.an.instanceof(Resource);
    expect(hal2.uri).to.eql(serverUri + '/templated.json?foo=bar');

  });

  it('should have expanded the uri after several follows', async () => {

    hal2 = await ketting.follow('next').follow('prev').follow('templated', {foo: 'bar'});
    expect(hal2).to.be.an.instanceof(Resource);
    expect(hal2.uri).to.eql(serverUri + '/templated.json?foo=bar');

  });

  it('should work even if no variables are specified', async () => {

    hal2 = await ketting.follow('next').follow('prev').follow('templated');
    expect(hal2).to.be.an.instanceof(Resource);
    expect(hal2.uri).to.eql(serverUri + '/templated.json');

  });

});
