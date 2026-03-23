import { describe, it} from 'node:test';

import { Links } from '../../src';
import { expect } from 'chai';

describe('Links object', () => {

  it('should instantiate', () => {

    const links = new Links('http://base.example/');
    expect(links).to.be.an.instanceof(Links);

  });

  it('should allow adding links', () => {

    const links = new Links('http://base.example/');
    links.add('rel', 'http://a.example/');
    links.add({
      rel: 'rel',
      href: 'http://b.example/'
    });

    expect(links.getAll()).to.eql([
      {
        context: 'http://base.example/',
        rel: 'rel',
        href: 'http://a.example/',
      },
      {
        context: 'http://base.example/',
        rel: 'rel',
        href: 'http://b.example/',
      },
    ]);

  });

  it('should overwrite links with .set', () => {

    const links = new Links('http://base.example/');
    links.set('rel', 'http://a.example/');
    links.set({
      rel: 'rel',
      href: 'http://b.example/'
    });

    expect(links.getMany('rel')).to.eql([
      {
        context: 'http://base.example/',
        rel: 'rel',
        href: 'http://b.example/',
      },
    ]);

    expect(links).to.be.an.instanceof(Links);

  });

  it('should return the correct value from "has()"', () => {

    const links = new Links('http://base.example/', [
      {
        context: 'http://base.example',
        href: 'http://a.example',
        rel: 'rel',
      }
    ]);
    expect(links.has('rel')).to.equal(true);
    expect(links.has('not-rel')).to.equal(false);

  });

  it('should get a single link from get()', () => {

    const links = new Links('http://base.example/');
    links.add('rel', 'http://a.example/');
    links.add({
      rel: 'rel',
      href: 'http://b.example/'
    });
    expect(links.get('rel')).to.eql({
      context: 'http://base.example/',
      rel: 'rel',
      href: 'http://a.example/',
    });

  });

  it('should return undefined from get() if the link did not exist', () => {
    const links = new Links('http://base.example/');
    links.add('rel', 'http://a.example/');
    links.add({
      rel: 'rel',
      href: 'http://b.example/'
    });
    expect(links.get('not-found')).to.eql(undefined);

  });

  it('should return an empty array from getMany if no links were found', () => {

    const links = new Links('http://base.example/');
    links.add('rel', 'http://a.example/');
    links.add({
      rel: 'rel',
      href: 'http://b.example/'
    });
    expect(links.getMany('not-found')).to.eql([]);

  });

  it('should allow cloning via the constructor', () => {
    const links = new Links('http://base.example/');
    links.add('rel', 'http://a.example/');
    links.add({
      rel: 'rel',
      href: 'http://b.example/'
    });
    const links2 = new Links('http://base.example', links);

    expect(links2.get('rel')).to.eql({
      context: 'http://base.example/',
      rel: 'rel',
      href: 'http://a.example/',
    });

  });

  it('should allow removing a link by rel', () => {
    const links = new Links('http://base.example/');
    links.add('rel', 'http://a.example/');
    links.add({
      rel: 'rel',
      href: 'http://b.example/'
    });
    links.add({
      rel: 'rel2',
      href: 'http://c.example/'
    });
    links.delete('rel');
    expect(links.getAll()).to.eql([
      {
        context: 'http://base.example/',
        rel: 'rel2',
        href: 'http://c.example/',
      }
    ]);

  });
  it('should allow removing a link by rel and href', () => {
    const links = new Links('http://base.example/');
    links.add('rel', 'http://a.example/');
    links.add({
      rel: 'rel',
      href: 'http://b.example/'
    });
    links.add({
      rel: 'rel2',
      href: 'http://c.example/'
    });
    links.delete('rel', 'http://a.example/');
    expect(links.getAll()).to.eql([
      {
        context: 'http://base.example/',
        rel: 'rel2',
        href: 'http://c.example/',
      },
      {
        context: 'http://base.example/',
        rel: 'rel',
        href: 'http://b.example/',
      },

    ]);

  });
  it('should not fail on deleting links that don\'t exist', () => {
    const links = new Links('http://base.example/');
    links.add({
      rel: 'rel2',
      href: 'http://c.example/'
    });
    links.delete('rel', 'http://a.example/');
    expect(links.getAll()).to.eql([
      {
        context: 'http://base.example/',
        rel: 'rel2',
        href: 'http://c.example/',
      },
    ]);

  });

});
