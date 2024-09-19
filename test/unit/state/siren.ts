import { expect } from 'chai';
import { factory } from '../../../src/state/siren';
import { SirenState, Client } from '../../../src';

describe('Siren representor', () => {

  it('should parse the example Siren object', async () => {

    const exampleObj = {
      'class': [ 'order' ],
      'properties': {
        'orderNumber': 42,
        'itemCount': 3,
        'status': 'pending'
      },
      'entities': [
        {
          'class': [ 'items', 'collection' ],
          'rel': [ 'http://x.io/rels/order-items' ],
          'href': 'http://api.x.io/orders/42/items',
        },
        {
          'class': [ 'info', 'customer' ],
          'rel': [ 'http://x.io/rels/customer' ],
          'properties': {
            'customerId': 'pj123',
            'name': 'Peter Joseph'
          },
          'title': 'Go to customer',
          'links': [
            { 'rel': [ 'self' ], 'href': 'http://api.x.io/customers/pj123' }
          ]
        }
      ],
      'actions': [
        {
          'name': 'add-item',
          'title': 'Add Item',
          'method': 'POST',
          'href': 'http://api.x.io/orders/42/items',
          'type': 'application/x-www-form-urlencoded',
          'fields': [
            { 'name': 'orderNumber', 'type': 'hidden', 'value': '42' },
            { 'name': 'productCode', 'type': 'text' },
            { 'name': 'quantity', 'type': 'number' }
          ]
        }
      ],
      'links': [
        { 'rel': [ 'self' ], 'href': 'http://api.x.io/orders/42' },
        { 'rel': [ 'previous' ], 'href': 'http://api.x.io/orders/41' },
        { 'rel': [ 'next' ], 'href': 'http://api.x.io/orders/43' }
      ]
    };

    const siren = await callFactory(exampleObj);
    expect(siren.links.getAll()).to.eql([
      {
        rel: 'self',
        href: 'http://api.x.io/orders/42',
        context: 'http://api.x.io/orders/42',
      },
      {
        rel: 'previous',
        href: 'http://api.x.io/orders/41',
        context: 'http://api.x.io/orders/42',
      },
      {
        rel: 'next',
        href: 'http://api.x.io/orders/43',
        context: 'http://api.x.io/orders/42',
      },
      {
        rel: 'http://x.io/rels/order-items',
        href: 'http://api.x.io/orders/42/items',
        context: 'http://api.x.io/orders/42',
        class: ['items', 'collection'],
      },
      {
        rel: 'http://x.io/rels/customer',
        href: 'http://api.x.io/customers/pj123',
        context: 'http://api.x.io/orders/42',
        title: 'Go to customer',
      },
    ]);

    const embedded = siren.getEmbedded()[0];
    expect(embedded.uri).to.eql('http://api.x.io/customers/pj123');
    expect(embedded.data).to.eql({
      'customerId': 'pj123',
      'name': 'Peter Joseph'
    });

  });

  it('should parse simple objects', async() => {

    const input = {
      'class': [ 'order' ],
      'properties': {
        'orderNumber': 42,
        'itemCount': 3,
        'status': 'pending'
      },
    };

    const siren = await callFactory(input);
    expect(siren.links.getAll()).to.eql([]);
    expect(siren.getEmbedded()).to.eql([]);

  });

  it('should clone objects', async() => {

    const input = {
      'class': [ 'order' ],
      'properties': {
        'orderNumber': 42,
        'itemCount': 3,
        'status': 'pending'
      },
    };

    const siren = await callFactory(input);
    const siren2 = siren.clone();
    expect(siren.uri).to.eql(siren2.uri);
    expect(siren.data).to.eql(siren2.data);
    expect(siren.links).to.eql(siren2.links);

  });

  it('should ignore entities without self links', async () => {

    const input:any = {
      'class': [ 'order' ],
      'properties': {
        'orderNumber': 42,
        'itemCount': 3,
        'status': 'pending'
      },
      'entities': [
        {
          'class': [ 'info', 'customer' ],
          'rel': [ 'http://x.io/rels/customer' ],
          'properties': {
            'customerId': 'pj123',
            'name': 'Peter Joseph'
          },
          'links': [
            {href: '/foo', rel: 'about' },
          ]
        },
        {
          'class': [ 'info', 'customer' ],
          'rel': [ 'http://x.io/rels/customer' ],
          'properties': {
            'customerId': 'pj123',
            'name': 'Peter Joseph'
          },
        }
      ],
    };

    const siren = await callFactory(input);
    expect(siren.links.getAll()).to.eql([]);
    expect(siren.getEmbedded()).to.eql([]);

  });

  describe('actions', () => {

    it('should execute POST actions', async () => {

      const exampleObj = {
        'class': [ 'order' ],
        'properties': {
          'orderNumber': 42,
          'itemCount': 3,
          'status': 'pending'
        },
        'actions': [
          {
            'name': 'add-item',
            'title': 'Add Item',
            'method': 'POST',
            'href': 'http://api.x.io/orders/42/items',
            'type': 'application/x-www-form-urlencoded',
            'fields': [
              { 'name': 'orderNumber', 'type': 'hidden', 'value': '42' },
              { 'name': 'productCode', 'type': 'text' },
              { 'name': 'quantity', 'type': 'number' }
            ]
          }
        ],
      };

      const siren = await callFactory(exampleObj);

      const result = await siren.action('add-item').submit({
        orderNumber: 5,
        productCode: 'foo-bar',
        quantity: 5
      });

      expect(result.uri).to.equal('http://api.x.io/orders/42/items');
      expect(result.data).to.equal('POST:orderNumber=5&productCode=foo-bar&quantity=5');

    });
    it('should throw an error when an unknown action is requested', async () => {

      const exampleObj:any = {
        'class': [ 'order' ],
        'properties': {
          'orderNumber': 42,
          'itemCount': 3,
          'status': 'pending'
        },
        'actions': []
      };

      const siren = await callFactory(exampleObj);

      let err = false;
      try {
        await siren.action('add-item');
      } catch {
        err = true;
      }
      expect(err).to.equal(true);

    });
    it('should throw an error an action without a name is ran', async () => {

      const exampleObj:any = {
        'class': [ 'order' ],
        'properties': {
          'orderNumber': 42,
          'itemCount': 3,
          'status': 'pending'
        },
        'actions': []
      };

      const siren = await callFactory(exampleObj);

      let err = false;
      try {
        await siren.action();
      } catch {
        err = true;
      }
      expect(err).to.equal(true);

    });
    it('should execute POST actions with application/json type', async () => {

      const exampleObj = {
        'class': [ 'order' ],
        'properties': {
          'orderNumber': 42,
          'itemCount': 3,
          'status': 'pending'
        },
        'actions': [
          {
            'name': 'add-item',
            'title': 'Add Item',
            'method': 'POST',
            'href': 'http://api.x.io/orders/42/items',
            'type': 'application/json',
            'fields': [
              { 'name': 'orderNumber', 'type': 'hidden', 'value': '42' },
              { 'name': 'productCode', 'type': 'text' },
              { 'name': 'quantity', 'type': 'number' }
            ]
          }
        ],
      };

      const siren = await callFactory(exampleObj);

      const result = await siren.action('add-item').submit({
        orderNumber: 5,
        productCode: 'foo-bar',
        quantity: 5
      });

      expect(result.uri).to.equal('http://api.x.io/orders/42/items');
      expect(result.data).to.equal('POST:{"orderNumber":5,"productCode":"foo-bar","quantity":5}');

    });

    it('should throw an error for unknown mimetypes', async () => {

      const exampleObj = {
        'class': [ 'order' ],
        'properties': {
          'orderNumber': 42,
          'itemCount': 3,
          'status': 'pending'
        },
        'actions': [
          {
            'name': 'add-item',
            'title': 'Add Item',
            'method': 'POST',
            'href': 'http://api.x.io/orders/42/items',
            'type': 'application/foo-bar',
            'fields': [
              { 'name': 'orderNumber', 'type': 'hidden', 'value': '42' },
              { 'name': 'productCode', 'type': 'text' },
              { 'name': 'quantity', 'type': 'number' }
            ]
          }
        ],
      };

      const siren = await callFactory(exampleObj);

      let err = false;

      try {
        await siren.action('add-item').submit({
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

      const exampleObj = {
        'class': [ 'order' ],
        'properties': {
          'orderNumber': 42,
          'itemCount': 3,
          'status': 'pending'
        },
        'actions': [
          {
            'name': 'add-item',
            'title': 'Add Item',
            'method': 'GET',
            'href': 'http://api.x.io/orders/42/items',
            'type': 'application/foo-bar',
          }
        ]
      };

      const siren = await callFactory(exampleObj);

      const state = await siren.action('add-item').submit({
        orderNumber: 5,
        productCode: 'foo-bar',
        quantity: 5
      });

      expect(state.uri).to.equal('http://api.x.io/orders/42/items?orderNumber=5&productCode=foo-bar&quantity=5');

    });
  });

  it('should throw an error when attempting to re-serialize Siren', async() => {

    const input = {
      'class': [ 'order' ],
      'properties': {
        'orderNumber': 42,
        'itemCount': 3,
        'status': 'pending'
      },
    };

    const siren = await callFactory(input);
    expect(() => siren.serializeBody()).to.throw(Error);

  });

});

async function callFactory(body: any): Promise<SirenState<any>> {

  const response = new Response(JSON.stringify(body));
  const state = await factory(new Client('http://example/'), 'http://api.x.io/orders/42', response);

  state.client = new Client('/');
  state.client.fetcher.use( async request => {

    return Promise.resolve(new Response(request.method + ':' + (await request.text()), { headers: { 'Content-Type': 'text/plain' }}));

  });

  return state;

}
