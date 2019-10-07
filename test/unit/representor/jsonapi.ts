import { expect } from 'chai';
import Link from '../../../src/link';
import JsonApi from '../../../src/representor/jsonapi';

describe('JsonApi representor', () => {

  it('should parse objects without links' , () => {

    const r = new JsonApi('/foo.json', 'application/vnd.api+json', '{"foo": "bar"}', new Map());
    expect(r.contentType).to.equal('application/vnd.api+json');
    expect(r.getBody()).to.eql({foo: 'bar'});
    expect(r.getLinks().length).to.equal(0);

  });

  it('should parse simple string links' , () => {

    const input = {
      links: {
        example: 'https://example.org',
      },
      data: {
        type: 'foo',
        id: 'bar',
      },
    };
    const r = new JsonApi('/foo.json', 'application/vnd.api+json', null, new Map());
    r.setBody(input);
    expect(r.contentType).to.equal('application/vnd.api+json');
    expect(r.getLinks()).to.eql([
      new Link({
        context: '/foo.json',
        href: 'https://example.org',
        rel: 'example',
      })
    ]);

  });

  it('should parse arrays of string links' , () => {

    const input = {
      links: {
        example: [
          'https://example.org',
          'https://example.com',
        ]
      },
      data: {
        type: 'foo',
        id: 'bar',
      },
    };
    const r = new JsonApi('/foo.json', 'application/vnd.api+json', null, new Map());
    r.setBody(input);
    expect(r.contentType).to.equal('application/vnd.api+json');
    expect(r.getLinks()).to.eql([
      new Link({
        context: '/foo.json',
        href: 'https://example.org',
        rel: 'example',
      }),
      new Link({
        context: '/foo.json',
        href: 'https://example.com',
        rel: 'example',
      })
    ]);

  });

  it('should parse object links' , () => {

    const input = {
      links: {
        example: {
          href: 'https://example.org'
        },
      },
      data: {
        type: 'foo',
        id: 'bar',
      },
    };
    const r = new JsonApi('/foo.json', 'application/vnd.api+json', null, new Map());
    r.setBody(input);
    expect(r.contentType).to.equal('application/vnd.api+json');
    expect(r.getLinks()).to.eql([
      new Link({
        context: '/foo.json',
        href: 'https://example.org',
        rel: 'example',
      })
    ]);

  });

  it('should parse arrays of object links' , () => {

    const input = {
      links: {
        example: [
          { href: 'https://example.org' },
          { href: 'https://example.com' },
        ]
      },
      data: {
        type: 'foo',
        id: 'bar',
      },
    };
    const r = new JsonApi('/foo.json', 'application/vnd.api+json', null, new Map());
    r.setBody(input);
    expect(r.contentType).to.equal('application/vnd.api+json');
    expect(r.getLinks()).to.eql([
      new Link({
        context: '/foo.json',
        href: 'https://example.org',
        rel: 'example',
      }),
      new Link({
        context: '/foo.json',
        href: 'https://example.com',
        rel: 'example',
      })
    ]);

  });

});
