const Ketting = require('../../lib/ketting');
const Resource = require('../../lib/resource');
const expect = require('chai').expect;
const Request = require('node-fetch').Request;

describe('OAuth2 Authentication', () => {

  describe('Owner flow', () => {

    it('should return 401 if no credentials were passed.', async() => {

      const ketting = new Ketting('http://localhost:3000/hal1.json');
      const resource = await ketting.follow('auth-oauth');
      const response = await resource.fetch();
      expect(response.status).to.eql(401);

    });

    it('should throw error if incorrect client credentials were passed.', (done) => {

      const ketting = new Ketting('http://localhost:3000/hal1.json', {
        auth: {
          type: 'oauth2',
          client: {
            clientId: 'fooClient',
            clientSecret: 'fooSecret',
            accessTokenUri: 'http://localhost:3000/oauth-token',
            scopes: ['test']
          },
          owner: {
            userName: 'fooOwner',
            password: 'barPassword'
          }
        }
      });
      ketting.follow('auth-oauth')
        .catch((error) => {
          expect(error).to.be.an('error');
          done();
        });

    });

    it('should return 401 if incorrect owner credentials were passed.', (done) => {

      const ketting = new Ketting('http://localhost:3000/hal1.json', {
        auth: {
          type: 'oauth2',
          client: {
            clientId: 'fooClient',
            clientSecret: 'barSecret',
            accessTokenUri: 'http://localhost:3000/oauth-token',
            scopes: ['test']
          },
          owner: {
            userName: 'fooOwner',
            password: 'fooPassword'
          }
        }
      });
      ketting.follow('auth-oauth')
        .catch((error) => {
          expect(error).to.be.an('error');
          done();
        });

    });

    it('should return 200 OK if correct credentials were passed.', async() => {

      const ketting = new Ketting('http://localhost:3000/hal1.json', {
        auth: {
          type: 'oauth2',
          client: {
            clientId: 'fooClient',
            clientSecret: 'barSecret',
            accessTokenUri: 'http://localhost:3000/oauth-token',
            scopes: ['test']
          },
          owner: {
            userName: 'fooOwner',
            password: 'barPassword'
          }
        }
      });

      const resource = await ketting.follow('auth-oauth');
      const response = await resource.fetch();
      expect(response.status).to.eql(200);

    });
  });

  it('should throw error when using unsupported flow', (done) => {
    const ketting = new Ketting('http://localhost:3000/hal1.json', {
      auth: {
        type: 'oauth2',
        client: {
          clientId: 'fooClient',
          clientSecret: 'barSecret',
          accessTokenUri: 'http://localhost:3000/oauth-token',
          scopes: ['test']
        },
        foo: {
          bar: ''
        }
      }
    });
    ketting.follow('auth-oauth')
      .catch((error) => {
        expect(error).to.be.an('error');
        expect(error.message).to.equal('Unsupported oauth2 flow');
        done();
      });
  });

});
