import { expect } from 'chai';
import { factory } from '../../../src/state/siren';
import { SirenState } from '../../../src';

describe('Siren representor', () => {

  it('should parse the example Siren object', async () => {

    const exampleObj = {
      "class": [ "order" ],
      "properties": {
          "orderNumber": 42,
          "itemCount": 3,
          "status": "pending"
      },
      "entities": [
        {
          "class": [ "items", "collection" ],
          "rel": [ "http://x.io/rels/order-items" ],
          "href": "http://api.x.io/orders/42/items"
        },
        {
          "class": [ "info", "customer" ],
          "rel": [ "http://x.io/rels/customer" ],
          "properties": {
            "customerId": "pj123",
            "name": "Peter Joseph"
          },
          "links": [
            { "rel": [ "self" ], "href": "http://api.x.io/customers/pj123" }
          ]
        }
      ],
      "actions": [
        {
          "name": "add-item",
          "title": "Add Item",
          "method": "POST",
          "href": "http://api.x.io/orders/42/items",
          "type": "application/x-www-form-urlencoded",
          "fields": [
            { "name": "orderNumber", "type": "hidden", "value": "42" },
            { "name": "productCode", "type": "text" },
            { "name": "quantity", "type": "number" }
          ]
        }
      ],
      "links": [
        { "rel": [ "self" ], "href": "http://api.x.io/orders/42" },
        { "rel": [ "previous" ], "href": "http://api.x.io/orders/41" },
        { "rel": [ "next" ], "href": "http://api.x.io/orders/43" }
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
      },
    ]);

    const embedded = siren.getEmbedded()[0];
    expect(embedded.uri).to.eql('http://api.x.io/customers/pj123');
    expect(embedded.data).to.eql({
      "class": [ "info", "customer" ],
      "rel": [ "http://x.io/rels/customer" ],
      "properties": {
        "customerId": "pj123",
        "name": "Peter Joseph"
      },
      "links": [
        { "rel": [ "self" ], "href": "http://api.x.io/customers/pj123" }
      ]
    });

  });

  it('should parse simple objects', async() => {

    const input = {
      "class": [ "order" ],
      "properties": {
          "orderNumber": 42,
          "itemCount": 3,
          "status": "pending"
      },
    };

    const siren = await callFactory(input);
    expect(siren.links.getAll()).to.eql([]);
    expect(siren.getEmbedded()).to.eql([]);

  });

  it('should ignore entities without self links', async () => {

    const input:any = {
      "class": [ "order" ],
      "properties": {
          "orderNumber": 42,
          "itemCount": 3,
          "status": "pending"
      },
      "entities": [
        {
          "class": [ "info", "customer" ],
          "rel": [ "http://x.io/rels/customer" ],
          "properties": {
            "customerId": "pj123",
            "name": "Peter Joseph"
          },
          "links": [
            {href: '/foo', rel: 'about' },
          ]
        },
        {
          "class": [ "info", "customer" ],
          "rel": [ "http://x.io/rels/customer" ],
          "properties": {
            "customerId": "pj123",
            "name": "Peter Joseph"
          },
        }
      ],
    };

    const siren = await callFactory(input);
    expect(siren.links.getAll()).to.eql([]);
    expect(siren.getEmbedded()).to.eql([]);

  });

});

function callFactory(body: any): Promise<SirenState> {

  const response = new Response(JSON.stringify(body));
  return factory('http://api.x.io/orders/42', response);

}
