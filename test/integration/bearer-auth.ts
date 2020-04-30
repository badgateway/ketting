import { expect } from 'chai';
import { Client, bearerAuth } from '../../src';

describe('Bearer Authentication', () => {

  it('should return 401 if no credentials were passed.', async () => {

    const ketting = new Client('http://localhost:3000/hal1.json');
    const resource = await ketting.follow('auth-bearer');
    const response = await resource.fetch({method: 'GET'});
    expect(response.status).to.eql(401);

  });

  it('should return 401 if incorrect credentials were passed.', async () => {

    const ketting = new Client('http://localhost:3000/hal1.json');
    ketting.use(bearerAuth('bar'));
    const resource = await ketting.follow('auth-bearer');
    const response = await resource.fetch({method: 'GET'});
    expect(response.status).to.eql(401);

  });

  it('should return 200 OK if correct credentials were passed.', async () => {

    const ketting = new Client('http://localhost:3000/hal1.json');
    ketting.use(bearerAuth('foo'));
    const resource = await ketting.follow('auth-bearer');
    const response = await resource.fetch({method: 'GET'});
    expect(response.status).to.eql(200);

  });

});
