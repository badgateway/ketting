import { describe, it, expect } from '#ketting-test';

import { parseLink } from '#ketting-dist/http/util.js';

describe('parseLink', () => {

  it('should parse links from a Link header', () => {

    const links = parseLink('http://example.org/', '</next>; rel="next", </up>; rel="up"');
    expect(links.get('next')?.href).to.equal('/next');
    expect(links.get('up')?.href).to.equal('/up');

  });

  it('should ignore Link header entries without a rel parameter', () => {

    const links = parseLink('http://example.org/', '</next>; rel="next", </style.css>; as="style"');
    expect(links.getAll().map(link => link.rel)).to.deep.equal(['next']);
    expect(links.get('next')?.href).to.equal('/next');

  });

});
