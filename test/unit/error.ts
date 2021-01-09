import problemFactory, { HttpError, Problem } from '../../src/http/error';
import { expect } from 'chai';

describe('HttpError', () => {
  it('should instantiate', () => {
    const response = {
      status: 400
    } as Response;

    const error = new HttpError(response);

    expect(error.status).to.equal(400);
    expect(error.response).to.equal(response);
  });
});

describe('Problem', () => {
  describe('should instantiate', () => {
    it('with an empty body', () => {
      const response = {
        status: 400,
      } as Response;
      const body = {};
      const problem = new Problem(response, body);

      expect(problem.status).to.equal(400);
      expect(problem.response).to.equal(response);

      expect(problem.body).to.deep.equal({
        type: 'about:blank',
        status: 400
      });
    });
    it('with a minimally populated body', () => {
      const response = {
        status: 400,
      } as Response;
      const body = {
        type: 'tag:ketting,2021:example_error',
        title: 'An example error'
      };
      const problem = new Problem(response, body);

      expect(problem.status).to.equal(400);
      expect(problem.response).to.equal(response);

      expect(problem.body).to.deep.equal({
        type: 'tag:ketting,2021:example_error',
        title: 'An example error',
        status: 400
      });
    });
    it('with a fully populated body', () => {
      const response = {
        status: 400,
      } as Response;
      const body = {
        type: 'https://example.com/probs/out-of-credit',
        title: 'You do not have enough credit.',
        status: 403,
        detail: 'Your current balance is 30, but that costs 50.',
        instance: '/account/12345/msgs/abc',
      };
      const problem = new Problem(response, body);

      expect(problem.status).to.equal(400);
      expect(problem.response).to.equal(response);

      expect(problem.body).to.deep.equal({
        type: 'https://example.com/probs/out-of-credit',
        title: 'You do not have enough credit.',
        status: 403,
        detail: 'Your current balance is 30, but that costs 50.',
        instance: '/account/12345/msgs/abc',
      });
    });
    it('with additional fields', () => {
      const response = {
        status: 400,
      } as Response;
      const body = {
        type: 'https://example.com/probs/out-of-credit',
        title: 'You do not have enough credit.',
        detail: 'Your current balance is 30, but that costs 50.',
        instance: '/account/12345/msgs/abc',
        balance: 30,
        accounts: ['/account/12345', '/account/67890']
      };
      const problem = new Problem(response, body);

      expect(problem.status).to.equal(400);
      expect(problem.response).to.equal(response);

      expect(problem.body).to.deep.equal({
        type: 'https://example.com/probs/out-of-credit',
        title: 'You do not have enough credit.',
        status: 400,
        detail: 'Your current balance is 30, but that costs 50.',
        instance: '/account/12345/msgs/abc',
        balance: 30,
        accounts: ['/account/12345', '/account/67890']
      });
    });
  });
});

describe('problemFactory', () => {
  it('creates a Problem for aplication/problem+json', async () => {
    const response = {
      status: 400,
      headers: {
        get: (name) => {
          expect(name).to.equal('Content-Type');
          return 'application/problem+json';
        }
      },
      json: async () => {
        return {
          type: 'https://example.com/probs/out-of-credit',
          title: 'You do not have enough credit.',
          detail: 'Your current balance is 30, but that costs 50.',
          instance: '/account/12345/msgs/abc',
          balance: 30,
          accounts: ['/account/12345', '/account/67890']
        };
      }
    } as Response;

    const error = await problemFactory(response);

    expect(error).to.be.an.instanceof(Problem);

    const problem = error as Problem;
    expect(problem.status).to.equal(400);
    expect(problem.response).to.equal(response);

    expect(problem.body).to.deep.equal({
      type: 'https://example.com/probs/out-of-credit',
      title: 'You do not have enough credit.',
      status: 400,
      detail: 'Your current balance is 30, but that costs 50.',
      instance: '/account/12345/msgs/abc',
      balance: 30,
      accounts: ['/account/12345', '/account/67890']
    });
  });
  it('creates an HttpError for anything else', async () => {
    const response = {
      status: 400,
      headers: {
        get: (name) => {
          expect(name).to.equal('Content-Type');
          return 'application/json';
        }
      },
      json: async () => {
        return {
          type: 'https://example.com/probs/out-of-credit',
          title: 'You do not have enough credit.',
          detail: 'Your current balance is 30, but that costs 50.',
          instance: '/account/12345/msgs/abc',
          balance: 30,
          accounts: ['/account/12345', '/account/67890']
        };
      }
    } as Response;

    const error = await problemFactory(response);

    expect(error).to.be.an.instanceof(HttpError);

    const problem = error as HttpError;
    expect(problem.status).to.equal(400);
    expect(problem.response).to.equal(response);
  });
});
