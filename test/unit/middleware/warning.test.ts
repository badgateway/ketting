import { describe, it , beforeAll, afterAll, expect} from '#ketting-test';

import warningMiddleware from '#ketting-dist/middlewares/warning.js';

const invoke = (response: Response) => {

  const mw = warningMiddleware();
  return mw(new Request('http://test.example'), () => Promise.resolve(response));

};

describe('Warning middleware', () => {

  let oldWarning: any;
  let lastMessage = '';

  beforeAll(() => {

    lastMessage = '';
    oldWarning = console.warn;
    console.warn = (msg: string) => {
      lastMessage = msg;
    };

  });

  it('Should normally not emit a warning', async () => {

    await invoke(new Response());
    expect(lastMessage).to.equal('');

  });
  it('Should emit a warning if a Deprecation header is returned', async () => {

    await invoke(new Response(null, {
      headers: {
        Deprecation: 'true'
      }
    }));
    expect(lastMessage).to.contain('deprecated');
    expect(lastMessage).to.contain('http://test.example');

  });
  it('Should include sunset information in the warning if it was provided', async () => {

    await invoke(new Response(null, {
      headers: {
        Deprecation: 'true',
        Sunset: 'Wed, 11 Nov 2020 23:59:59 GMT'
      }
    }));
    expect(lastMessage).to.contain('deprecated');
    expect(lastMessage).to.contain('http://test.example');
    expect(lastMessage).to.contain('Wed, 11 Nov 2020 23:59:59 GMT');

  });
  it('Should include a documentation link for the deprecation status if it was provided', async () => {

    await invoke(new Response(null, {
      headers: {
        Deprecation: 'true',
        Link: '</docs>; rel="deprecation"',
      }
    }));
    expect(lastMessage).to.contain('deprecated');
    expect(lastMessage).to.contain('http://test.example');
    expect(lastMessage).to.contain('http://test.example/docs');

  });


  afterAll(() => {

    console.warn = oldWarning;

  });

});
