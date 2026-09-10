import {expect, describe, it} from '#ketting-test';

import {Ketting} from 'ketting';

describe('Submitting an action with a multipart/form-data content type', async () => {

  it('should send Blob values as binary parts', async ({testApplicationUris}) => {
    const serverUri = testApplicationUris.createTenantUri();
    const ketting = new Ketting(serverUri + '/hal-forms.json');

    const state = await ketting.go().get();
    const result = await state.action('upload').submit({
      title: 'My upload',
      attachment: new Blob(['binary content'], {type: 'application/octet-stream'}),
    });

    expect(result.data.method).to.eq('PUT');
    expect(result.data.headers['content-type']).to.match(/^multipart\/form-data; boundary=/);
    expect(result.data.body.title).to.eq('My upload');
    expect(result.data.body.attachment).to.include({
      type: 'application/octet-stream',
      size: 14,
      content: 'binary content',
    });
  });

  it('should preserve the name of File values', async ({testApplicationUris}) => {
    const serverUri = testApplicationUris.createTenantUri();
    const ketting = new Ketting(serverUri + '/hal-forms.json');

    const state = await ketting.go().get();
    const result = await state.action('upload').submit({
      title: 'My upload',
      attachment: new File(['hello'], 'hello.txt', {type: 'text/plain'}),
    });

    expect(result.data.body.attachment).to.eql({
      filename: 'hello.txt',
      type: 'text/plain',
      size: 5,
      content: 'hello',
    });
  });

  it('should send Uint8Array values as binary parts', async ({testApplicationUris}) => {
    const serverUri = testApplicationUris.createTenantUri();
    const ketting = new Ketting(serverUri + '/hal-forms.json');

    const state = await ketting.go().get();
    const result = await state.action('upload').submit({
      title: 'My upload',
      attachment: new TextEncoder().encode('bytes'),
    });

    expect(result.data.body.attachment).to.include({
      size: 5,
      content: 'bytes',
    });
  });

  it('should send one part per item for array values', async ({testApplicationUris}) => {
    const serverUri = testApplicationUris.createTenantUri();
    const ketting = new Ketting(serverUri + '/hal-forms.json');

    const state = await ketting.go().get();
    const result = await state.action('upload').submit({
      title: 'My upload',
      attachment: new Blob(['a']),
      tags: ['one', 'two'],
    });

    expect(result.data.body.tags).to.eql(['one', 'two']);
  });

  it('should convert non-binary values to strings', async ({testApplicationUris}) => {
    const serverUri = testApplicationUris.createTenantUri();
    const ketting = new Ketting(serverUri + '/hal-forms.json');

    const state = await ketting.go().get();
    const result = await state.action('upload').submit({
      title: 'My upload',
      attachment: new Blob(['a']),
      count: 3,
      enabled: true,
      nothing: null,
      meta: {foo: 'bar'},
      skipped: undefined,
    });

    expect(result.data.body.count).to.eq('3');
    expect(result.data.body.enabled).to.eq('true');
    expect(result.data.body.nothing).to.eq('');
    expect(result.data.body.meta).to.eq('{"foo":"bar"}');
    expect(result.data.body).to.not.have.property('skipped');
  });

  it('should throw when a required field is missing', async ({testApplicationUris}) => {
    const serverUri = testApplicationUris.createTenantUri();
    const ketting = new Ketting(serverUri + '/hal-forms.json');

    const state = await ketting.go().get();
    await expect(state.action('upload').submit({
      title: 'My upload',
    })).rejects.toThrow('The attachment field is required in this form');
  });

});
