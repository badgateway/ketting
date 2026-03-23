import {describe, it} from 'node:test';
import testServer from '../testserver';

import {expect} from 'chai';
import {Ketting} from '../../src';
import Resource from '../../src/resource';

describe('Invoking submitFollow on an action', async () => {

  it('should return the new resource when a header Local with HTTP status 201 is received', async () => {

    const serverUri = testServer();
    const ketting = new Ketting(serverUri + '/hal-forms.json');

    const state = await ketting.go().get();
    const newResource = await state.action('create').submitFollow({title: 'Posted resource'});

    expect(newResource).to.be.an.instanceof(Resource);

    const newState = await newResource.get();
    expect(newState.uri).to.not.eq(state.uri);
    expect(newState.uri).to.match(/\.json$/);

    expect(newState.data).to.eql({title: 'Posted resource'});
  });

  it('should return the same resource when an HTTP status 204 is received', async () => {
    const serverUri = testServer();
    const ketting = new Ketting(serverUri + '/hal-forms.json');

    const state = await ketting.go().get();
    const updatedResource = await state.action('update').submitFollow({foo: 'baz'});

    expect(updatedResource).to.be.an.instanceof(Resource);

    const updatedState = await updatedResource.get();
    expect(updatedState.uri).to.eq(state.uri);

    expect(updatedState.data).to.eql({foo: 'baz'});
  });

  it('should throw an exception when there was an HTTP error', async () => {
    const serverUri = testServer();
    const ketting = new Ketting(serverUri + '/hal-forms.json');

    const state = await ketting.go().get();
    const action = state.action('createFailingWithStatus400');
    let exception;
    try {
      await action.submitFollow({
        data: {foo: 'bar'}
      });
    } catch (ex: any) {
      exception = ex;
    }
    expect(exception.response.status).to.equal(400);
  });

});
