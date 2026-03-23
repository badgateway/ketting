import { describe, it } from 'node:test';
import testServer from '../testserver';

import { expect } from 'chai';
import { Ketting, oauth2 } from '../../src';

describe('OAuth2 Authentication', () => {

  const serverUri = testServer();

  describe('Owner flow', () => {

    it('should return 401 if no credentials were passed.', async () => {

      const ketting = new Ketting(serverUri + '/hal1.json');
      const resource = await ketting.follow('auth-oauth');
      const response = await resource.fetch({method: 'GET'});
      expect(response.status).to.eql(401);

    });

    it('should throw error if incorrect client credentials were passed.', async () => {

      const ketting = new Ketting(serverUri + '/hal1.json');
      ketting.use(
        oauth2({
          grantType: 'password',
          clientId: 'fooClient',
          clientSecret: 'fooSecret',
          tokenEndpoint: serverUri + '/oauth-token',
          scope: ['test'],
          userName: 'fooOwner',
          password: 'barPassword'
        })
      );

      try {
        await ketting.follow('auth-oauth');

      } catch  {
        return;
      }
      throw new Error('Expected an error');

    });

    it('should return 401 if incorrect owner credentials were passed.', async () => {

      const ketting = new Ketting(serverUri + '/hal1.json');

      ketting.use(
        oauth2({
          grantType: 'password',
          clientId: 'fooClient',
          clientSecret: 'barSecret',
          tokenEndpoint: serverUri + '/oauth-token',
          scope: ['test'],
          userName: 'fooOwner',
          password: 'fooPassword'
        })
      );
      try {
        await ketting.follow('auth-oauth');

      } catch  {
        return;
      }
      throw new Error('Expected an error');

    });

    it('should return 200 OK if correct credentials were passed.', async () => {

      const ketting = new Ketting(serverUri + '/hal1.json');
      ketting.use(
        oauth2({
          grantType: 'password',
          clientId: 'fooClient',
          clientSecret: 'barSecret',
          tokenEndpoint: serverUri + '/oauth-token',
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

    it('should throw error if incorrect client credentials were passed.', async () => {

      const ketting = new Ketting(serverUri + '/hal1.json');
      ketting.use(
        oauth2({
          grantType: 'client_credentials',
          clientId: 'badlient',
          clientSecret: 'badSecret',
          tokenEndpoint: serverUri + '/oauth-token',
          scope: ['test']
        })
      );
      try {
        await ketting.follow('auth-oauth');

      } catch  {
        return;
      }
      throw new Error('Expected an error');

    });

    it('should return 200 OK if correct credentials were passed.', async () => {

      const ketting = new Ketting(serverUri + '/hal1.json');
      ketting.use(
        oauth2({
          grantType: 'client_credentials',
          clientId: 'fooClientCredentials',
          clientSecret: 'barSecretCredentials',
          tokenEndpoint: serverUri + '/oauth-token',
          scope: ['test']
        })
      );

      const resource = await ketting.follow('auth-oauth');
      const response = await resource.fetch({method: 'GET'});
      expect(response.status).to.eql(200);

    });
  });

});
