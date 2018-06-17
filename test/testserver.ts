const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const route = require('koa-path-match')();
const logger = require('koa-logger')
const koaStatic = require('koa-static');
const fs = require('fs');
const app = new Koa();

let resources = {};

// Log to console
app.use(logger());

// Use body parser
app.use(bodyParser());

function staticFile(url, path, type) {
  app.use(
    route(url)
    .get(ctx => {
      ctx.response.body = fs.readFileSync(path);
      ctx.response.type = type;
    })
  );

}

app.use(koaStatic(__dirname + '/../browser/'));

staticFile('/', 'fixtures/index.html', 'text/html');
staticFile('/mocha.js', __dirname + '/../node_modules/mocha/mocha.js', 'text/javascript');
staticFile('/mocha.css', __dirname + '/../node_modules/mocha/mocha.css', 'text/css');



app.use(
  route('/headers', ctx => {
    ctx.response.status = 200;
    ctx.response.body = ctx.request.headers;
  })
);

// Reset the server to the beginning state
app.use(
  route('/reset')
  .post(ctx => {
    resources = {};
    ctx.response.status = 204;
    ctx.response.body = '';
  })
);

// HTTP errors as a service
app.use(
  route('/error/:code', ctx => {
    ctx.response.status = parseInt(ctx.params.code);
    ctx.response.body = '';
  })
);

// Redirect testing
app.use(
  route('/redirect')
  .get(ctx => {
    ctx.response.redirect('/hal2.json');
  })
);


// Return request body as we received it
app.use(
  route('/echo')
  .post(ctx => {
    ctx.response.statusCode = 200;
    ctx.response.type = ctx.request.headers['content-type'];
    ctx.response.body = ctx.req;
  })
);

// Return a HTTP Link header
app.use(
  route('/link-header')
  .get(ctx => {

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
  .delete(ctx => {

     ctx.response.status = 410;
     ctx.response.body = {
       type: "http://evertpot.com/problem-test",
       title: "Some sort of error!"
     };
     ctx.response.type = 'application/problem+json';

  })
);

app.use(
  route('/auth/basic')
  .get(ctx => {
    const encoded = 'Basic dXNlcjpwYXNz'; // base64(user:pass)
    if (!ctx.request.headers.authorization || ctx.request.headers.authorization!==encoded) {
      ctx.response.status = 401;
      ctx.response.body = '';
      ctx.response.set('Authorization', 'Basic');
    } else {
      ctx.response.body = { ok: true };
      ctx.response.status = 200;
    }
  })
);

app.use(
  route('/auth/bearer')
  .get(ctx => {
    const encoded = 'Bearer foo';
    if (!ctx.request.headers.authorization || ctx.request.headers.authorization!==encoded) {
      ctx.response.status = 401;
      ctx.response.body = '';
      ctx.response.set('Authorization', 'Bearer');
    } else {
      ctx.response.body = { ok: true };
      ctx.response.status = 200;
    }
  })
);

app.use(
  route('/auth/oauth')
  .get(ctx => {
    const encoded = 'Bearer foo';
    if (!ctx.request.headers.authorization || ctx.request.headers.authorization!==encoded) {
      ctx.response.status = 401;
      ctx.response.body = '';
      ctx.response.set('Authorization', 'Bearer');
    } else {
      ctx.response.body = { ok: true };
      ctx.response.status = 200;
    }
  })
);

app.use(
  route('/oauth-token')
    .post(ctx => {
      const requestBody = ctx.request.body;
      const clientInfo = Buffer.from(ctx.request.headers.authorization.split(' ')[1], 'base64').toString('ascii');

      // Check that the client info is legitimate an then check if the user
      // information is correct if a password grant or the refresh token is
      // valid if doing a refresh grant
      if (clientInfo === 'fooClient:barSecret'
        && (
          (requestBody.grant_type === 'password'
          && requestBody.username === 'fooOwner'
          && requestBody.password === 'barPassword')
        ||
          (requestBody.grant_type === 'refresh_token'
          && requestBody.refresh_token === 'fooRefresh')
        )
      ){
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

// Rest stuff!
app.use(
  route('/:id')
  .get(ctx => {

    if (typeof resources[ctx.params.id] === "undefined") {
      resources[ctx.params.id] = fs.readFileSync(__dirname + '/fixtures/' + ctx.params.id);
    }

    if (resources[ctx.params.id] === null) {
      ctx.response.status = 404;
      ctx.response.body = '';
      return;
    }
    ctx.response.type = 'application/json';
    ctx.response.body = resources[ctx.params.id];

  })
  .put(ctx => {

    return new Promise( (res, rej) => {
      let body = '';
      ctx.req.setEncoding('utf-8');
      ctx.req.on('data', chunk => {

        body += chunk;

      });
      ctx.req.on('end', () => {

        resources[ctx.params.id] = body;
        ctx.response.status = 204;
        ctx.response.body = '';
        res();

      });
    });
  })
  .delete(ctx => {

    resources[ctx.params.id] = null;
    ctx.response.status = 204;
    ctx.response.body = '';

  })
  .post(ctx => {

    return new Promise( (res, rej) => {
      let someId = 0;
      do {
        someId++;
      } while (resources[someId + '.json']);

      let body = '';
      ctx.req.setEncoding('utf-8');
      ctx.req.on('data', chunk => {

        body += chunk;

      });
      ctx.req.on('end', () => {

        resources[someId + '.json'] = body;
        ctx.response.status = 201;
        ctx.response.body = '';
        ctx.response.set('Location', '/' + someId + '.json');
        res();

      });

    });

  })
);

var port = 3000;
app.listen(port);

console.log('Server is now online. Head to http://localhost:' + port + '/ to run tests in a browser');
