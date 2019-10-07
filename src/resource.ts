import * as LinkHeader from 'http-link-header';
import FollowablePromise from './followable-promise';
import problemFactory from './http-error';
import Ketting from './ketting';
import { Link, LinkSet } from './link';
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
  repr: Representation<T> | null;

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

  private inFlightRefresh: Promise<any> | null = null;

  /**
   * A list of rels that should be added to a Prefer-Push header.
   */
  private preferPushRels: Set<string>;

  constructor(client: Ketting, uri: string, contentType: string | null = null) {

    this.client = client;
    this.uri = uri;
    this.repr = null;
    this.contentType = contentType;
    this.preferPushRels = new Set();

  }

  /**
   * Fetches the resource representation.
   * Returns a promise that resolves to a parsed json object.
   */
  async get(): Promise<T> {

    const r = await this.representation();
    return r.getBody();

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
      },
    };
    await this.fetchAndThrow(params);

  }

  /**
   * Updates the resource representation with a new JSON object.
   */
  async delete(): Promise<void> {

    await this.fetchAndThrow({ method: 'DELETE' });

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
      return this.go(<string> response.headers.get('location'));
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

      const headers: { [name: string]: string } = {
        Accept: this.contentType ? this.contentType : this.client.getAcceptHeader()
      };

      if (this.preferPushRels.size > 0) {
        headers['Prefer-Push'] = Array.from(this.preferPushRels).join(' ');
        headers.Prefer = 'transclude="' + Array.from(this.preferPushRels).join(';') + '"';
      }

      this.inFlightRefresh = this.fetchAndThrow({
        method: 'GET' ,
        headers
      }).then( result1 => {
        response = result1;
        return response.text();
      })
      .then( result2 => {
        body = result2;
        return [response, body];
      });

      try {
        await this.inFlightRefresh;
      } finally {
        this.inFlightRefresh = null;
      }

    } else {
      // Something else asked for refresh, so we piggypack on it.
      [response, body] = await this.inFlightRefresh;

    }

    const contentType = response!.headers.get('Content-Type');
    if (!contentType) {
      throw new Error('Server did not respond with a Content-Type header');
    }

    // Extracting HTTP Link header.
    const httpLinkHeader = response!.headers.get('Link');

    const headerLinks: LinkSet = new Map();

    if (httpLinkHeader) {

      for (const httpLink of LinkHeader.parse(httpLinkHeader).refs) {
        // Looping through individual links
        for (const rel of httpLink.rel.split(' ')) {
          // Looping through space separated rel values.
          if (headerLinks.has(rel)) {
            const newLink = new Link({
              rel: rel,
              context: this.uri,
              href: httpLink.uri
            });
            if (headerLinks.has(rel)) {
              headerLinks.get(rel)!.push(newLink);
            } else {
              headerLinks.set(rel, [newLink]);
            }
          }
        }
      }
    }
    this.repr = this.client.createRepresentation(
      this.uri,
      contentType,
      body!,
      headerLinks
    ) as any as Representation<T>;

    if (!this.contentType) {
      this.contentType = contentType;
    }

    for (const [subUri, subBody] of Object.entries(this.repr.getEmbedded())) {
      const subResource = this.go(subUri);
      subResource.repr = this.client.createRepresentation(
        subUri,
        contentType,
        null,
        new Map(),
      );
      subResource.repr.setBody(subBody);
    }

    return this.repr.getBody();

  }

  /**
   * Returns the links for this resource, as a promise.
   *
   * The rel argument is optional. If it's given, we will only return links
   * from that relationship type.
   */
  async links(rel?: string): Promise<Link[]> {

    const r = await this.representation();

    // After we got a representation, it no longer makes sense to remember
    // the rels we want to add to Prefer-Push.
    this.preferPushRels = new Set();

    return r.getLinks(rel);

  }

  /**
   * Returns a specific link based on it's rel.
   *
   * If multiple links with the same rel existed, we're only returning the
   * first. If no link with the specified link existed, a LinkNotFound
   * exception will be thrown.
   *
   * The rel argument is optional. If it's given, we will only return links
   * from that relationship type.
   */
  async link(rel: string): Promise<Link> {

    const r = await this.representation();

    // After we got a representation, it no longer makes sense to remember
    // the rels we want to add to Prefer-Push.
    this.preferPushRels = new Set();

    return r.getLink(rel);

  }

  /**
   * Follows a relationship, based on its reltype. For example, this might be
   * 'alternate', 'item', 'edit' or a custom url-based one.
   *
   * This function can also follow templated uris. You can specify uri
   * variables in the optional variables argument.
   */
  follow(rel: string, variables?: object): FollowablePromise {

    this.preferPushRels.add(rel);

    return new FollowablePromise(async (res: any, rej: any) => {

      try {
        const link = await this.link(rel);

        let href;

        if (link.templated && variables) {
          href = link.expand(variables);
        } else {
          href = link.resolve();
        }

        const resource = this.go(href);
        if (link.type) {
          resource.contentType = link.type;
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
  async followAll(rel: string): Promise<Resource[]> {

    this.preferPushRels.add(rel);
    const links = await this.links(rel);

    return links.map((link: Link) => {
      const resource = this.go(link.resolve());
      if (link.type) {
        resource.contentType = link.type;
      }
      return resource;
    });

  }

  /**
   * Resolves a new resource based on a relative uri.
   *
   * Use this function to manually get a Resource object via a uri. The uri
   * will be resolved based on the uri of the current resource.
   *
   * This function doesn't do any HTTP requests.
   */
  go(uri: string): Resource {

    uri = resolve(this.uri, uri);
    return this.client.go(uri);

  }

  /**
   * Returns the representation for the object.
   * If it wasn't fetched yet, this function does the fetch as well.
   *
   * Usually you will want to use the `get()` method instead, unless you need
   * the full object.
   */
  async representation(): Promise<Representation<T>> {

    if (!this.repr) {
      await this.refresh();
    }

    return this.repr!;

  }

  clearCache(): void {

    this.repr = null;

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
  async fetchAndThrow(input: Request|string|RequestInit, init?: RequestInit): Promise<Response> {

    const response = await this.fetch(input, init);

    if (response.ok) {
      return response;
    } else {
      throw await problemFactory(response);
    }

  }

}
