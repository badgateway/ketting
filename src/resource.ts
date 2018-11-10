import LinkHeader from 'http-link-header';
import FollowablePromise from './followable-promise';
import problemFactory from './http-error';
import Ketting from './ketting';
import Link from './link';
import Representation from './representor/base';
import { mergeHeaders } from './utils/fetch-helper';
import { resolve } from './utils/url';

/**
 * A 'resource' represents an endpoint on the server.
 *
 * The endpoint has a uri, you might for example be able to GET its
 * presentation.
 *
 * A resource may also have a list of links on them, pointing to other
 * resources.
 *
 * @param {Client} client
 * @param {string} uri
 * @constructor
 */
export default class Resource<T = any> {

  /**
   * Reference to the main Client
   */
  client: Ketting;

  /**
   * The current representation, or body of the resource.
   */
  repr: Representation | null;

  /**
   * The uri of the resource
   */
  uri: string;

  /**
   * A default mimetype for the resource.
   *
   * This mimetype is used for PUT and POST requests by default.
   * The mimetype is sniffed in a few different ways.
   *
   * If a GET request is done, and the GET request had a mimetype it will
   * be used to set this value.
   *
   * It's also possible for resources to get a mimetype through a link.
   *
   * If the mimetype was "null" when doing the request, the chosen mimetype
   * will come from the first item in Client.resourceTypes
   */
  contentType: string | null;

  private inFlightRefresh: Promise<any> = null;

  constructor(client: Ketting, uri: string, contentType: string = null) {

    this.client = client;
    this.uri = uri;
    this.repr = null;
    this.contentType = contentType;

  }

  /**
   * Fetches the resource representation.
   * Returns a promise that resolves to a parsed json object.
   */
  async get(): Promise<T> {

    const r = await this.representation();
    return r.body;

  }

  /**
   * Updates the resource representation with a new JSON object.
   */
  async put(body: T): Promise<void> {

    const contentType = this.contentType || this.client.contentTypes[0].mime;
    const params = {
      method: 'PUT',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': contentType,
        'Accept' : this.contentType ? this.contentType : this.client.getAcceptHeader()
      }
    };
    await this.fetchAndThrow(params);

    // Wipe out the local cache
    this.repr = null;

  }

  /**
   * Updates the resource representation with a new JSON object.
   */
  async delete(): Promise<void> {

    await this.fetchAndThrow({ method: 'DELETE' });

    // Wipe out the local cache
    this.repr = null;

  }

  /**
   * Sends a POST request to the resource.
   *
   * This function assumes that POST is used to create new resources, and
   * that the response will be a 201 Created along with a Location header that
   * identifies the new resource location.
   *
   * This function returns a Promise that resolves into the newly created
   * Resource.
   *
   * If no Location header was given, it will resolve still, but with an empty
   * value.
   */
  async post(body: object): Promise<Resource|null> {

    const contentType = this.contentType || this.client.contentTypes[0].mime;
    const response = await this.fetchAndThrow(
      {
        method: 'POST',
        body: JSON.stringify(body),
        headers: {
          'Content-Type': contentType,
        }
      }
    );

    if (response.headers.has('location')) {
      return this.client.getResource(
        resolve(
          this.uri,
          <string> response.headers.get('location')
        )
      );
    }
    return null;

  }

  /**
   * Sends a PATCH request to the resource.
   *
   * This function defaults to a application/json content-type header.
   */
  async patch(body: object): Promise<void> {

    await this.fetchAndThrow(
      {
        method: 'PATCH',
        body: JSON.stringify(body),
        headers: {
          'Content-Type' : 'application/json'
        }
      }
    );

    // Wipe out the local cache
    this.repr = null;

  }

  /**
   * Refreshes the representation for this resource.
   *
   * This function will return the a parsed JSON object, like the get
   * function does.
   *
   * @return {object}
   */
  async refresh(): Promise<T> {

    let response: Response;
    let body: string;

    // If 2 systems request a 'refresh' at the exact same time, this mechanism
    // will coalesc them into one.
    if (!this.inFlightRefresh) {

      this.inFlightRefresh = this.fetchAndThrow({
        method: 'GET' ,
        headers: {
          Accept: this.contentType ? this.contentType : this.client.getAcceptHeader()
        }
      }).then( result1 => {
        response = result1;
        return response.text();
      })
      .then( result2 => {
        body = result2;
        return [response, body];
      });

      await this.inFlightRefresh;
      this.inFlightRefresh = null;

    } else {
      // Something else asked for refresh, so we piggypack on it.
      [response, body] = await this.inFlightRefresh;

    }

    const contentType = response.headers.get('Content-Type');
    if (!contentType) {
      throw new Error('Server did not respond with a Content-Type header');
    }
    this.repr = new (this.client.getRepresentor(contentType))(
       this.uri,
       contentType,
       body
    );

    if (!this.contentType) {
      this.contentType = contentType;
    }

    // Extracting HTTP Link header.
    const httpLinkHeader = response.headers.get('Link');
    if (httpLinkHeader) {

      for (const httpLink of LinkHeader.parse(httpLinkHeader).refs) {
        // Looping through individual links
         for (const rel of httpLink.rel.split(' ')) {
           // Looping through space separated rel values.
           const baseHref = httpLink.hasOwnProperty('anchor') ? resolve(this.uri, httpLink.anchor) : this.uri;
           this.repr.links.push(
              new Link({
                rel: rel,
                baseHref: baseHref,
                href: httpLink.uri
              })
           );
         }
      }

    }

    // Parsing and storing embedded uris
    for (const uri of Object.keys(this.repr.embedded)) {
      const subResource = this.client.getResource(uri);
      subResource.repr = new (this.client.getRepresentor(contentType))(
        uri,
        contentType,
        this.repr.embedded[uri]
      );
    }

    return this.repr.body;

  }

  /**
   * Returns the links for this resource, as a promise.
   *
   * The rel argument is optional. If it's given, we will only return links
   * from that relationship type.
   */
  async links(rel?: string, anchor?: string): Promise<Link[]> {

    const r = await this.representation();

    const baseHref = anchor ? resolve(this.uri, anchor) : this.uri;
    const links = r.links.filter( item => item.baseHref === baseHref );

    if (!rel) { return links; }

    return links.filter( item => item.rel === rel );

  }

  /**
   * Follows a relationship, based on its reltype. For example, this might be
   * 'alternate', 'item', 'edit' or a custom url-based one.
   *
   * This function can also follow templated uris. You can specify uri
   * variables in the optional variables argument.
   */
  follow(rel: string, variables?: object, anchor?: string): FollowablePromise {

    return new FollowablePromise(async (res: any, rej: any) => {

      try {
        const links = await this.links(rel, anchor);

        let href;
        if (links.length === 0) {
          throw new Error('Relation with type ' + rel + ' not found on resource ' + this.uri);
        }
        if (links[0].templated && variables) {
          href = links[0].expand(variables);
        } else {
          href = links[0].resolve();
        }

        const resource = this.client.getResource(
          href
        );
        if (links[0].type) {
          resource.contentType = links[0].type;
        }

        res(resource);

      } catch (reason) {
        rej(reason);
      }

    });

  }

  /**
   * Follows a relationship based on its reltype. This function returns a
   * Promise that resolves to an array of Resource objects.
   *
   * If no resources were found, the array will be empty.
   */
  async followAll(rel: string, anchor?: string): Promise<Resource[]> {

    const links = await this.links(rel, anchor);

    return links.map((link: Link) => {
      const resource = this.client.getResource(
        link.resolve()
      );
      if (link.type) {
        resource.contentType = link.type;
      }
      return resource;
    });

  }

  /**
   * Returns the representation for the object.
   * If it wasn't fetched yet, this function does the fetch as well.
   *
   * Usually you will want to use the `get()` method instead, unless you need
   * the full object.
   */
  async representation(): Promise<Representation> {

    if (!this.repr) {
      await this.refresh();
    }

    return <Representation> this.repr;

  }

  /**
   * Does an arbitrary HTTP request on the resource using the Fetch API.
   *
   * The method signature is the same as the MDN fetch object. However, it's
   * possible in this case to not specify a URI or specify a relative URI.
   *
   * When doing the actual request, any relative uri will be resolved to the
   * uri of the current resource.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Request/Request
   */
  fetch(input: Request|string|RequestInit, init?: RequestInit): Promise<Response> {

    let uri = null;
    let newInit: RequestInit = {};

    if (input === undefined) {
      // Nothing was provided, we're operating on the resource uri.
      uri = this.uri;
    } else if (typeof input === 'string') {
      // If it's a string, it might be relative uri so we're resolving it
      // first.
      uri = resolve(this.uri, input);

    } else if (input instanceof Request) {
      // We were passed a request object. We need to extract all its
      // information into the init object.
      uri = resolve(this.uri, (<Request> input).url);

      newInit.method = input.method;
      newInit.headers = new Headers(input.headers);
      // @ts-ignore: Possibly an error due to https://github.com/Microsoft/TypeScript/issues/15199
      newInit.body = input.body;
      newInit.mode = input.mode;
      newInit.credentials = input.credentials;
      newInit.cache = input.cache;
      newInit.redirect = input.redirect;
      newInit.referrer = input.referrer;
      newInit.integrity = input.integrity;

    } else if (input instanceof Object) {
      // if it was a regular 'object', but not a Request, we're assuming the
      // method was called with the init object as it's first parameter. This
      // is not allowed in the default Fetch API, but we do allow it because
      // in the resource, specifying the uri is optional.
      uri = this.uri;
      newInit = <RequestInit> input;
    } else {
      throw new TypeError('When specified, input must be a string, Request object or a key-value object');
    }

    // if the 'init' argument is specified, we're using it to override things
    // in newInit.
    if (init) {

      for (const key of Object.keys(init)) {
        if (key === 'headers') {
          // special case.
          continue;
        }
        (<any> newInit)[key] = (<any> init)[key];
      }
      newInit.headers = mergeHeaders([
        newInit.headers,
        init.headers
      ]);
    }

    // @ts-ignore cross-fetch definitions are broken. See https://github.com/lquixada/cross-fetch/pull/19
    const request = new Request(uri, newInit);

    return this.client.fetch(request);

  }

  /**
   * Does a HTTP request and throws an exception if the server emitted
   * a HTTP error.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Request/Request
   */
  async fetchAndThrow(input: Request|string|object, init?: object): Promise<Response> {

    const response = await this.fetch(input, init);

    if (response.ok) {
      return response;
    } else {
      throw await problemFactory(response);
    }

  }

}
