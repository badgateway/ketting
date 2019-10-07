import { expect } from 'chai';

import Ketting from '../../src/ketting';
import Hal from '../../src/representor/hal';
import Html from '../../src/representor/html';

describe('Ketting', () => {

  it('should return a HTML representor when requested', () => {

    const ketting = new Ketting('https://example.org/');
    const representor = ketting.createRepresentation('/foo', 'text/html', '', new Map());
    expect(representor).to.eql(Html);

  });

  it('should return a Hal representor when requested', () => {

    const ketting = new Ketting('https://example.org');
    const representor = ketting.createRepresentation('/foo', 'application/hal+json', '', new Map());
    expect(representor).to.eql(Hal);

  });

  it('should throw an error when an unknown representor was requested ', () => {

    const ketting = new Ketting('https://example.org');
    expect( () => ketting.createRepresentation('/foo', 'text/plain', '', new Map())).to.throw(Error);

  });

  it('should throw an error an a representor was incorrecly configured ', () => {

    const ketting = new Ketting('https://example.org');
    ketting.contentTypes.push({
      mime: 'text/plain',
      representor: 'bla-bla'
    });
    expect( () => ketting.createRepresentation('/foo', 'text/plain', '', new Map()) ).to.throw(Error);

  });

});
