const Koa = require('koa');
const route = require('koa-path-match')();
const logger = require('koa-logger')
const fs = require('fs');
const app = new Koa();

// Log to console
app.use(logger());

app.use(route('/:id')
  .get(ctx => {

    ctx.response.type = 'application/json';
    ctx.response.body = fs.createReadStream('fixtures/' + ctx.params.id);

  })
);



app.listen(3000);
