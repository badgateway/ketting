const Koa = require('koa');
const route = require('koa-path-match')();
const logger = require('koa-logger')
const fs = require('fs');
const app = new Koa();

let resources = {};

// Log to console
app.use(logger());

app.use(
  route('/headers')
  .get(ctx => {

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

app.listen(3000);
