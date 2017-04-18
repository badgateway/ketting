const Koa = require('koa');
const route = require('koa-path-match')();
const logger = require('koa-logger')
const fs = require('fs');
const app = new Koa();

const resources = {};

// Log to console
app.use(logger());

app.use(
  route('/:id')
  .get(ctx => {

    if (typeof resources[ctx.params.id] === "undefined") {
      resources[ctx.params.id] = fs.readFileSync(__dirname + '/fixtures/' + ctx.params.id);
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
        ctx.response.statusCode = 200;
        ctx.response.body = '';
        res();

      });
    });

  })
);

app.listen(3000);
