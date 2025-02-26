import { describe, it } from 'node:test';

import { expect } from 'chai';
import { htmlStateFactory } from '../../../src/state';
import { Link, Client } from '../../../src';

describe('HTML representor', () => {

  type TestTuple = [string] | [string, Link] | [string, Link, Link];

  const tests: TestTuple[] = [
    [
      '<link rel="me" href="https://evertpot.com/" />',
      {rel: 'me', context: '/index.html', href: 'https://evertpot.com/'}
    ],
    [
      '<link rel="me" href="https://evertpot.com/">',
      {rel: 'me', context: '/index.html', href: 'https://evertpot.com/'}
    ],
    [
      '<LINK rel="me" href="https://evertpot.com/">',
      {rel: 'me', context: '/index.html', href: 'https://evertpot.com/'}
    ],
    [
      '<link REL="me" href="https://evertpot.com/">',
      {rel: 'me', context: '/index.html', href: 'https://evertpot.com/'}
    ],
    [
      '<link href="https://evertpot.com/" rel="me" />',
      {rel: 'me', context: '/index.html', href: 'https://evertpot.com/'}
    ],
    [
      '<link href="https://evertpot.com/" rel="me" title="my website!"/>',
      {rel: 'me', context: '/index.html', href: 'https://evertpot.com/'}
    ],
    [
      '<link href="foo.css" rel="stylesheet" type="text/css" />',
      {rel: 'stylesheet', context: '/index.html', href: 'foo.css', type: 'text/css'}
    ],
    [
      '<a href="https://evertpot.com/" rel="me">',
      {rel: 'me', context: '/index.html', href: 'https://evertpot.com/'}
    ],
    [
      '<A href="https://evertpot.com/" rel="me">',
      {rel: 'me', context: '/index.html', href: 'https://evertpot.com/'}
    ],
    [
      '<a HREF="https://evertpot.com/" rel="me">',
      {rel: 'me', context: '/index.html', href: 'https://evertpot.com/'}
    ],
    [
      '<a rel="me" href="https://evertpot.com/">',
      {rel: 'me', context: '/index.html', href: 'https://evertpot.com/'}
    ],
    [
      '<a rel="icon favicon" href="favicon.ico">',
      {rel: 'icon', context: '/index.html', href: 'favicon.ico'},
      {rel: 'favicon', context: '/index.html', href: 'favicon.ico'},
    ],
    [
      // Ignoring links without rel
      '<link href="https://evertpot.com/" />',
    ],
    [
      // Ignoring links without href
      '<link rel="me" />',
    ]
  ];

  tests.forEach( value => {

    it('should parse ' + value[0], async () => {

      const response = new Response(value[0]);
      const html = await htmlStateFactory(
        new Client('http://example/'),
        '/index.html',
        response
      );

      const links = value.slice(1);

      expect(html.uri).to.equal('/index.html');
      expect(html.links.getAll()).to.eql(links);

    });

  });

  describe('HTML forms', () => {

    it('should execute POST actions', async () => {

      const html = `
<html>
  <body>
    <form method="POST" type="application/x-www-form-urlencoded" action="http://example/items" rel="add-item">
    </form>
  </body>
</html>
`;

      const htmlState = await callFactory(html);

      const result = await htmlState.action('add-item').submit({
        orderNumber: 5,
        productCode: 'foo-bar',
        quantity: 5
      });

      expect(result.uri).to.equal('http://example/items');
      expect(result.data).to.equal('POST:orderNumber=5&productCode=foo-bar&quantity=5');

    });
    it('should find HTML forms by id attribute', async () => {

      const html = `
<html>
  <body>
    <form method="POST" type="application/x-www-form-urlencoded" action="http://example/items" id="add-item">
    </form>
  </body>
</html>
`;

      const htmlState = await callFactory(html);

      const result = await htmlState.action('add-item').submit({
        orderNumber: 5,
        productCode: 'foo-bar',
        quantity: 5
      });

      expect(result.uri).to.equal('http://example/items');
      expect(result.data).to.equal('POST:orderNumber=5&productCode=foo-bar&quantity=5');

    });
    it('should throw an error when an unknown action is requested', async () => {

      const html = `
<html>
  <body>
    <form method="POST" type="application/x-www-form-urlencoded" action="http://example/items" rel="add-item">
    </form>
  </body>
</html>
`;
      const htmlState = await callFactory(html);

      let err = false;
      try {
        await htmlState.action('add-item2');
      } catch {
        err = true;
      }
      expect(err).to.equal(true);

    });

    it('should throw an error when no actions are defined', async () => {

      const html = `
<html>
  <body>
  </body>
</html>
`;
      const htmlState = await callFactory(html);

      let err = false;
      try {
        await htmlState.action();
      } catch {
        err = true;
      }
      expect(err).to.equal(true);

    });
    it('should throw an error an action without a name is ran', async () => {

      const html = `
<html>
  <body>
    <form method="POST" type="application/x-www-form-urlencoded" action="http://example/items" rel="add-item">
    </form>
  </body>
</html>
`;

      const htmlState = await callFactory(html);

      const result =  await htmlState.action().submit({
        orderNumber: 5,
        productCode: 'foo-bar',
        quantity: 5
      });

      expect(result.uri).to.equal('http://example/items');
      expect(result.data).to.equal('POST:orderNumber=5&productCode=foo-bar&quantity=5');

    });
    it('should execute POST actions with application/json type', async () => {

      const html = `
<html>
  <body>
    <form method="POST" enctype="application/json" action="http://example/items" rel="add-item">
    </form>
  </body>
</html>
`;
      const htmlState = await callFactory(html);
      const result = await htmlState.action('add-item').submit({
        orderNumber: 5,
        productCode: 'foo-bar',
        quantity: 5
      });

      expect(result.uri).to.equal('http://example/items');
      expect(result.data).to.equal('POST:{"orderNumber":5,"productCode":"foo-bar","quantity":5}');

    });

    it('should throw an error for unknown mimetypes', async () => {

      const html = `
<html>
  <body>
    <form method="POST" enctype="application/foo-bar" action="http://example/items" rel="add-item">
    </form>
  </body>
</html>
`;

      const htmlState = await callFactory(html);

      let err = false;

      try {
        await htmlState.action('add-item').submit({
          orderNumber: 5,
          productCode: 'foo-bar',
          quantity: 5
        });
      } catch {
        err = true;
      }
      expect(err).to.equal(true);

    });
    it('should work with GET', async () => {

      const html = `
<html>
  <body>
    <form method="GET" action="/items" rel="add-item">
    </form>
  </body>
</html>
`;
      const htmlState = await callFactory(html);

      const state = await htmlState.action('add-item').submit({
        orderNumber: 5,
        productCode: 'foo-bar',
        quantity: 5
      });

      expect(state.uri).to.equal('http://example/items?orderNumber=5&productCode=foo-bar&quantity=5');

    });
    it('should guess all the right defaults', async () => {

      const html = `
<html>
  <body>
    <form>
    </form>
  </body>
</html>
`;
      const htmlState = await callFactory(html);

      const state = await htmlState.action().submit({
        orderNumber: 5,
        productCode: 'foo-bar',
        quantity: 5
      });

      expect(state.uri).to.equal('http://example/orders?orderNumber=5&productCode=foo-bar&quantity=5');

    });
  });

  it('should serialize itself', async () => {

    const html = '<h1>hi</h1>';
    const state = await callFactory(html);
    expect(state.serializeBody()).to.equal(html);

  });

  it('should be able to clone html', async () => {

    const html = '<h1>hi</h1>';
    const state = await callFactory(html);
    const state2 = state.clone();
    state2.client = state.client;
    state2.timestamp = state.timestamp;

    expect(state).to.deep.equal(state2);

  });

});

async function callFactory(body: string){

  const response = new Response(body);
  const state = await htmlStateFactory(
    new Client('http://example/'),
    'http://example/orders',
    response
  );

  state.client = new Client('/');
  state.client.fetcher.use( async request => {

    return Promise.resolve(new Response(request.method + ':' + (await request.text()), { headers: { 'Content-Type': 'text/plain' }}));

  });

  return state;

}
