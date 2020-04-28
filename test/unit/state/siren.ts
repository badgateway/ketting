import { expect } from 'chai';
import Link from '../../../src/link';
import Siren from '../../../src/representor/siren';
describe('Siren representor', () => {

  it('should parse the example Siren object', () => {

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

    const siren = new Siren('http://api.x.io/orders/42', 'application/vnd.siren+json', JSON.stringify(exampleObj), new Map());
    expect(siren.getLinks()).to.eql([
      new Link({
        rel: 'self',
        href: 'http://api.x.io/orders/42',
        context: 'http://api.x.io/orders/42',
      }),
      new Link({
        rel: 'previous',
        href: 'http://api.x.io/orders/41',
        context: 'http://api.x.io/orders/42',
      }),
      new Link({
        rel: 'next',
        href: 'http://api.x.io/orders/43',
        context: 'http://api.x.io/orders/42',
      }),
      new Link({
        rel: 'http://x.io/rels/order-items',
        href: 'http://api.x.io/orders/42/items',
        context: 'http://api.x.io/orders/42',
      }),
      new Link({
        rel: 'http://x.io/rels/customer',
        href: 'http://api.x.io/customers/pj123',
        context: 'http://api.x.io/orders/42',
      }),
    ]);

    expect(siren.getEmbedded()).to.eql({
      'http://api.x.io/customers/pj123':
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
    });

  });

  it('should parse simple objects', () => {

    const input = {
      "class": [ "order" ],
      "properties": {
          "orderNumber": 42,
          "itemCount": 3,
          "status": "pending"
      },
    };

    const siren = new Siren('http://api.x.io/orders/42', 'application/vnd.siren+json', null, new Map());
    siren.setBody(input);

    expect(siren.getLinks()).to.eql([]);
    expect(siren.getEmbedded()).to.eql({});

  });

  it('should ignore entities without self links', () => {

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

    const siren = new Siren('http://api.x.io/orders/42', 'application/vnd.siren+json', null, new Map());
    siren.setBody(input);
    expect(siren.getLinks()).to.eql([]);
    expect(siren.getEmbedded()).to.eql({});

  });

});
