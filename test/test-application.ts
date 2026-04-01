import * as fs from 'node:fs';
import Koa, {Context as KoaContext,} from 'koa';
import bodyParser from 'koa-bodyparser';
import logger from 'koa-logger';
import Route from 'koa-path-match';
import {Server} from 'node:http';
import {dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import handlebars from 'handlebars';

const currentDirectory = dirname(fileURLToPath(import.meta.url));

type Context = KoaContext & {
  params: { [s: string]: string };
};

type Resource = Buffer | string | null;

class Tenant {
  private readonly resourceByUri = new Map<string, Resource>();

  reset() {
    this.resourceByUri.clear();
  }

  getResource(uri: string): Resource | undefined {
    return this.resourceByUri.get(uri);
  }

  computeResourceIfAbsent(uri: string, factory: () => Resource): Resource {
    let resource: Resource | undefined = this.resourceByUri.get(uri);
    if (resource === undefined) {
      resource = factory();
      this.resourceByUri.set(uri, resource);
    }
    return resource;
  }

  setResource(uri: string, resource: Resource) {
    this.resourceByUri.set(uri, resource);
  }
}

class Tenants {
  private readonly tenantById = new Map<string, Tenant>();

  resetTenant(tenantId: string) {
    this.tenantById.get(tenantId)?.reset();
  }

  getResource(tenantId: string, uri: string): Resource | undefined {
    return this.tenantById.get(tenantId)?.getResource(uri);
  }

  computeResourceIfAbsent(tenantId: string, uri: string, factory: () => Resource): Resource {
    return this.computeTenantIfAbsent(tenantId).computeResourceIfAbsent(uri, factory);
  }

  setResource(tenantId: string, uri: string, resource: Resource) {
    this.computeTenantIfAbsent(tenantId).setResource(uri, resource);
  }

  private computeTenantIfAbsent(tenantId: string): Tenant {
    let tenant: Tenant | undefined = this.tenantById.get(tenantId);
    if (tenant === undefined) {
      tenant = new Tenant();
      this.tenantById.set(tenantId, tenant);
    }
    return tenant;
  }
}

class HandlebarsTemplates {
  private static readonly templateByFilePath = new Map<string, HandlebarsTemplateDelegate>();

  static get(filePath: string): HandlebarsTemplateDelegate {
    let template = this.templateByFilePath.get(filePath);
    if (!template) {
      template = handlebars.compile(fs.readFileSync(filePath, {encoding: 'utf-8'}));
      this.templateByFilePath.set(filePath, template);
    }
    return template;
  }
}


export class TestApplication {

  readonly uri: string;

  private readonly tenants = new Tenants();
  private readonly server: Server;

  private constructor() {
    const route = Route();

    const koa = new Koa();
    // Log to console
    koa.use(logger());

    // Use body parser
    koa.use(bodyParser());

    koa.use(
      route('/headers', (ctx: Context) => {
        ctx.response.status = 200;
        ctx.response.body = ctx.request.headers;
      })
    );

    // HTTP errors as a service
    koa.use(
      route('/error/:code', (ctx: Context) => {
        ctx.response.status = parseInt(ctx.params.code, 10);
        ctx.response.body = '';
      })
    );

    // Redirect testing
    koa.use(
      route('/redirect')
        .get((ctx: Context) => {
          ctx.response.redirect('/hal2.json');
        })
    );


    // Return request body as we received it
    koa.use(
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
    koa.use(
      route('/no-content-type', (ctx: Context) => {
        ctx.response.status = 200;
        ctx.response.body = 'hi';
        ctx.response.set('Content-Type', '');
      })
    );

    // Return a JSON problem document (RFC7807)
    koa.use(
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

    koa.use(
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

    koa.use(
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

    koa.use(
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

    let counter = 0;
    // This endpoint returns a new number every time it gets called
    koa.use(route('/counter').get( (ctx: Context) => {

      counter++;
      ctx.response.body = {
        counter: counter,
      };

    }));

    koa.use(
      route('/:tenantId/oauth-token')
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


    // Return a HTTP Link header
    koa.use(
      route('/:tenantId/link-header')
        .get((ctx: Context) => {

          ctx.response.set('Link', [
            '</hal2.json>; rel="next"',
            '</TheBook/chapter2>; rel="previous"; title*=UTF-8\'de\'n%c3%a4chstes%20Kapitel',
            '<http://example.org/>; rel="start http://example.net/relation/other"'
          ]);
          ctx.response.body = { ok: true };

        })
    );

    // Reset the server to the beginning state
    koa.use(
      route('/:tenantId/reset')
        .post((ctx: Context) => {
          this.tenants.resetTenant(ctx.params.tenantId);
          ctx.response.status = 204;
          ctx.response.body = '';
        })
    );

    // Rest stuff!
    koa.use(
      route('/:tenantId/:id')
        .get(async (ctx: Context) => {
          const delayInMsHeader = ctx?.headers?.['delay-in-ms'];
          if (delayInMsHeader) {
            await new Promise(resolve => setTimeout(resolve, parseInt(delayInMsHeader.toString())));
          }
          const tenantId = ctx.params.tenantId;
          const resource = this.tenants.computeResourceIfAbsent(
            tenantId,
            ctx.params.id,
            () => HandlebarsTemplates.get(currentDirectory + '/fixtures/' + ctx.params.id + '.mustache')({tenantId})
          );

          if (resource === null) {
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
          ctx.response.body = resource;

        })
        .put((ctx: Context) => {

          let body;
          if (typeof ctx.request.body === 'string') {
            body = ctx.request.body;
          } else {
            body = JSON.stringify(ctx.request.body);
          }
          this.tenants.setResource(
            ctx.params.tenantId,
            ctx.params.id,
            body
          );
          ctx.response.status = 204;
          ctx.response.body = '';

        })
        .delete((ctx: Context) => {

          this.tenants.setResource(
            ctx.params.tenantId,
            ctx.params.id,
            null
          );

          ctx.response.status = 204;
          ctx.response.body = '';

        })
        .post((ctx: Context): Promise<void> => {

          return new Promise( res => {

            const tenantId = ctx.params.tenantId;

            let someId = 0;
            do {
              someId++;
            } while (this.tenants.getResource(tenantId, someId + '.json'));

            const body = ctx.request.body;
            this.tenants.setResource(tenantId, someId + '.json', body as any);

            ctx.response.status = 201;
            ctx.response.body = '';
            ctx.response.set('Location', '/' + tenantId + '/' + someId + '.json');
            res();

          });

        })
    );

    this.server = koa.listen();

    const address = this.server.address();
    if (!address || typeof address !== 'object' || !('port' in address)) {
      throw new Error('Unexpected address type');
    }
    this.uri = `http://localhost:${address.port}`;
    console.info(`Test application is listening on ${this.uri}`);
  }

  static start(): TestApplication {
    return new TestApplication();
  }

  close() {
    this.server.close();
  }
}

function createRandomString(): string {
  return (Math.random() + 1).toString(36).substring(7);
}
