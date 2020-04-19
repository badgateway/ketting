import { expect } from 'chai';
import { Ketting, oauth2 } from '../../src';

describe('OAuth2 Authentication', () => {

  describe('Owner flow', () => {

    it('should return 401 if no credentials were passed.', async () => {

      const ketting = new Ketting('http://localhost:3000/hal1.json');
      const resource = await ketting.follow('auth-oauth');
      const response = await resource.fetch({method: 'GET'});
      expect(response.status).to.eql(401);

    });

    it('should throw error if incorrect client credentials were passed.', (done) => {

      const ketting = new Ketting('http://localhost:3000/hal1.json');
      ketting.use(
        oauth2({
          grantType: 'password',
          clientId: 'fooClient',
          clientSecret: 'fooSecret',
          tokenEndpoint: 'http://localhost:3000/oauth-token',
          scope: ['test'],
          userName: 'fooOwner',
          password: 'barPassword'
        })
      );
      ketting.follow('auth-oauth')
        .catch((error:any) => {
          expect(error).to.be.an.instanceof(Error);
          done();
        });

    });

    it('should return 401 if incorrect owner credentials were passed.', (done) => {

      const ketting = new Ketting('http://localhost:3000/hal1.json');

      ketting.use(
        oauth2({
          grantType: 'password',
          clientId: 'fooClient',
          clientSecret: 'barSecret',
          tokenEndpoint: 'http://localhost:3000/oauth-token',
          scope: ['test'],
          userName: 'fooOwner',
          password: 'fooPassword'
        })
      );
      ketting.follow('auth-oauth')
        .catch((error:any) => {
          expect(error).to.be.an.instanceof(Error);
          done();
        });

    });

    it('should return 200 OK if correct credentials were passed.', async () => {

      const ketting = new Ketting('http://localhost:3000/hal1.json');
      ketting.use(
        oauth2({
          grantType: 'password',
          clientId: 'fooClient',
          clientSecret: 'barSecret',
          tokenEndpoint: 'http://localhost:3000/oauth-token',
          scope: ['test'],
          userName: 'fooOwner',
          password: 'barPassword'
        })
      );

      const resource = await ketting.follow('auth-oauth');
      const response = await resource.fetch({method: 'GET'});
      expect(response.status).to.eql(200);

    });

  });

  describe('Client credentials flow', () => {

    it('should throw error if incorrect client credentials were passed.', (done) => {

      const ketting = new Ketting('http://localhost:3000/hal1.json');
      ketting.use(
        oauth2({
          grantType: 'client_credentials',
          clientId: 'badlient',
          clientSecret: 'badSecret',
          tokenEndpoint: 'http://localhost:3000/oauth-token',
          scope: ['test']
        })
      );
      ketting.follow('auth-oauth')
        .catch((error:any) => {
          expect(error).to.be.an.instanceof(Error);
          done();
        });

    });

    it('should return 200 OK if correct credentials were passed.', async () => {

      const ketting = new Ketting('http://localhost:3000/hal1.json');
      ketting.use(
        oauth2({
          grantType: 'client_credentials',
          clientId: 'fooClientCredentials',
          clientSecret: 'barSecretCredentials',
          tokenEndpoint: 'http://localhost:3000/oauth-token',
          scope: ['test']
        })
      );

      const resource = await ketting.follow('auth-oauth');
      const response = await resource.fetch({method: 'GET'});
      expect(response.status).to.eql(200);

    });
  });

});
