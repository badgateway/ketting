import * as fs from 'fs';
import { default as Koa } from 'koa';
import { Context as KoaContext } from 'koa';
import bodyParser from 'koa-bodyparser';
import logger from 'koa-logger';
import Route from 'koa-path-match';
import koaStatic from 'koa-static';
import { before, after } from 'node:test';

type Context = KoaContext & {
  params: { [s: string]: string };
};

function getApp() {

  const app = new Koa();
  const route = Route();

  let resources: {
    [uri: string]: Buffer | string | null;
  } = {};

  // Log to console
  app.use(logger());

  // Use body parser
  app.use(bodyParser());

  function staticFile(url: string, path: string, type: string) {
    app.use(
      route(url)
        .get((ctx: Context) => {
          ctx.response.body = fs.readFileSync(path);
          ctx.response.type = type;
        })
    );

  }

  app.use(koaStatic(__dirname + '/../browser/'));

  staticFile('/', __dirname + '/fixtures/index.html', 'text/html');
  staticFile('/mocha.js', __dirname + '/../node_modules/mocha/mocha.js', 'text/javascript');
  staticFile('/mocha.css', __dirname + '/../node_modules/mocha/mocha.css', 'text/css');

  app.use(
    route('/headers', (ctx: Context) => {
      ctx.response.status = 200;
      ctx.response.body = ctx.request.headers;
    })
  );

  // Reset the server to the beginning state
  app.use(
    route('/reset')
      .post((ctx: Context) => {
        resources = {};
        ctx.response.status = 204;
        ctx.response.body = '';
      })
  );

  // HTTP errors as a service
  app.use(
    route('/error/:code', (ctx: Context) => {
      ctx.response.status = parseInt(ctx.params.code, 10);
      ctx.response.body = '';
    })
  );

  // Redirect testing
  app.use(
    route('/redirect')
      .get((ctx: Context) => {
        ctx.response.redirect('/hal2.json');
      })
  );


  // Return request body as we received it
  app.use(
    route('/echo', (ctx: Context) => {
      ctx.response.status = 200;
      ctx.response.type = ctx.request.headers['content-type']!;
      ctx.response.body = {
        headers: ctx.request.headers,
        body: ctx.request.body,
        method: ctx.request.method,
      };
    })
  );

  // Return no content-type
  app.use(
    route('/no-content-type', (ctx: Context) => {
      ctx.response.status = 200;
      ctx.response.body = 'hi';
      ctx.response.set('Content-Type', '');
    })
  );

  // Return a HTTP Link header
  app.use(
    route('/link-header')
      .get((ctx: Context) => {

        ctx.response.set('Link', [
          '</hal2.json>; rel="next"',
          '</TheBook/chapter2>; rel="previous"; title*=UTF-8\'de\'n%c3%a4chstes%20Kapitel',
          '<http://example.org/>; rel="start http://example.net/relation/other"'
        ]);
        ctx.response.body = { ok: true };

      })
  );

  // Return a JSON problem document (RFC7807)
  app.use(
    route('/problem')
      .delete((ctx: Context) => {

        ctx.response.status = 410;
        ctx.response.body = {
          type: 'http://evertpot.com/problem-test',
          title: 'Some sort of error!'
        };
        ctx.response.type = 'application/problem+json';

      })
  );

  app.use(
    route('/auth/basic')
      .get((ctx: Context) => {
        const encoded = 'Basic dXNlcjpwYXNz'; // base64(user:pass)
        if (!ctx.request.headers.authorization || ctx.request.headers.authorization !== encoded) {
          ctx.response.status = 401;
          ctx.response.body = '';
          ctx.response.set('WWW-Authenticate', 'Basic');
        } else {
          ctx.response.body = { ok: true };
          ctx.response.status = 200;
        }
      })
  );

  app.use(
    route('/auth/bearer')
      .get((ctx: Context) => {
        const encoded = 'Bearer foo';
        if (!ctx.request.headers.authorization || ctx.request.headers.authorization !== encoded) {
          ctx.response.status = 401;
          ctx.response.body = '';
          ctx.response.set('WWW-Authenticate', 'Bearer');
        } else {
          ctx.response.body = { ok: true };
          ctx.response.status = 200;
        }
      })
  );

  app.use(
    route('/auth/oauth')
      .get((ctx: Context) => {
        const encoded = 'Bearer foo';
        if (!ctx.request.headers.authorization || ctx.request.headers.authorization !== encoded) {
          ctx.response.status = 401;
          ctx.response.body = '';
          ctx.response.set('WWW-Authenticate', 'Bearer');
        } else {
          ctx.response.body = { ok: true };
          ctx.response.status = 200;
        }
      })
  );

  app.use(
    route('/oauth-token')
      .post((ctx: Context) => {
        const requestBody: any = ctx.request.body;
        const clientInfo = Buffer.from(ctx.request.headers.authorization!.split(' ')[1], 'base64').toString('ascii');

        // Check that the client info is legitimate an then check if the user
        // information is correct if a password grant or the refresh token is
        // valid if doing a refresh grant
        if (
          (
            clientInfo === 'fooClient:barSecret'
            && (
              (requestBody.grant_type === 'password'
                && requestBody.username === 'fooOwner'
                && requestBody.password === 'barPassword')
              ||
                (requestBody.grant_type === 'refresh_token'
                && requestBody.refresh_token === 'fooRefresh')
            )
          ) || (
            clientInfo === 'fooClientCredentials:barSecretCredentials'
            && (
              requestBody.grant_type === 'client_credentials'
            ||
              (requestBody.grant_type === 'refresh_token'
              && requestBody.refresh_token === 'fooRefresh')
            )
          )
        ) {
          ctx.response.body = {
            token_type: 'bearer',
            access_token: 'foo',
            refresh_token: 'bar'
          };
          ctx.response.status = 200;
        } else {
          ctx.response.status = 401;
          ctx.response.body = '';
        }
      })
  );

  let counter = 0;
  // This endpoint returns a new number every time it gets called
  app.use(route('/counter').get( (ctx: Context) => {

    counter++;
    ctx.response.body = {
      counter: counter,
    };

  }));

  // Rest stuff!
  app.use(
    route('/:id')
      .get(async (ctx: Context) => {
        const delayInMsHeader = ctx?.headers?.['delay-in-ms'];
        if (delayInMsHeader) {
          await new Promise(resolve => setTimeout(resolve, parseInt(delayInMsHeader.toString())));
        }
        if (resources[ctx.params.id] === undefined) {
          resources[ctx.params.id] = fs.readFileSync(__dirname + '/fixtures/' + ctx.params.id);
        }

        if (resources[ctx.params.id] === null) {
          ctx.response.status = 404;
          ctx.response.body = '';
          return;
        }
        // The test server needs cleanup :(
        if (ctx.params.id.includes('json-api')) {
          ctx.response.type = 'application/vnd.api+json';
        } else {
          ctx.response.type = 'application/json';
        }
        const preferHeader = ctx?.headers?.['prefer'];
        if (preferHeader) {
          ctx.res.setHeader('preference-applied', preferHeader);
        }
        ctx.res.setHeader('response-id', createRandomString());
        ctx.response.body = resources[ctx.params.id];

      })
      .put((ctx: Context) => {

        let body;
        if (typeof ctx.request.body === 'string') {
          body = ctx.request.body;
        } else {
          body = JSON.stringify(ctx.request.body);
        }
        resources[ctx.params.id] = body;
        ctx.response.status = 204;
        ctx.response.body = '';

      })
      .delete((ctx: Context) => {

        resources[ctx.params.id] = null;
        ctx.response.status = 204;
        ctx.response.body = '';

      })
      .post((ctx: Context): Promise<void> => {

        return new Promise( (res, rej) => {

          let someId = 0;
          do {
            someId++;
          } while (resources[someId + '.json']);

          const body = ctx.request.body;
          resources[someId + '.json'] = body as any;
          ctx.response.status = 201;
          ctx.response.body = '';
          ctx.response.set('Location', '/' + someId + '.json');
          res();

        });

      })
  );
  return app;

}

export default () => {

  // I don't know if there's a smarter way to do this, right now I'm picking
  // a random port for each server.
  // This means collisions are possible and when they happen they might cause tests to fail
  const port = Math.floor(Math.random() * 60000) + 3000; // a port between 3000 and 63000

  const app = getApp();
  let server;

  before(async () => {
    console.info('Server is now online. Head to http://localhost:' + port + '/ to run tests in a browser');
    server = app.listen(port);
  });
  after(async () => {
    await server.close();
  });

  return 'http://localhost:' + port;
};


function createRandomString(): string {
  return (Math.random() + 1).toString(36).substring(7);
}
