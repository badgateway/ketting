import { FollowerMany, FollowerOne } from './follower';
import problemFactory from './http-error';
import Ketting from './ketting';
import { Link } from './link';
import Representator from './representor/base';
import { LinkVariables } from './types';
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
 */
export default class Resource<TResource = any, TPatch = Partial<TResource>> {

  /**
   * Reference to the main Client
   */
  client: Ketting;

  /**
   * The current representation, or body of the resource.
   */
  repr: Representator<TResource> | null;

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
   */
  contentType: string | null;

  private inFlightRefresh: Promise<TResource> | null = null;

  constructor(client: Ketting, uri: string, contentType: string | null = null) {

    this.client = client;
    this.uri = uri;
    this.repr = null;
    this.contentType = contentType;
    this.nextRefreshHeaders = {};

  }

  /**
   * Fetches the resource representation.
   * Returns a promise that resolves to a parsed json object.
   */
  async get(): Promise<TResource> {

    const r = await this.representation();
    return r.getBody();

  }

  /**
   * Updates the resource representation with a new JSON object.
   */
  async put(body: TResource): Promise<void> {

    const contentType = this.contentType || this.client.representorHelper.getMimeTypes()[0];
    const params = {
      method: 'PUT',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': contentType,
        'Accept' : this.contentType ? this.contentType : this.client.representorHelper.getAcceptHeader()
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
  post(body: any): Promise<Resource | null>;
  post<TPostResource>(body: any): Promise<Resource<TPostResource>>;
  async post(body: any): Promise<Resource | null> {

    const contentType = this.contentType || this.client.representorHelper.getMimeTypes()[0];
    const response = await this.fetchAndThrow(
      {
        method: 'POST',
        body: JSON.stringify(body),
        headers: {
          'Content-Type': contentType,
        }
      }
    );

    switch (response.status) {
      case 205 :
        return this;
      case 201:
        if (response.headers.has('location')) {
          return this.go(<string> response.headers.get('location'));
        }
        return null;
      default:
        return null;
    }

  }

  /**
   * Sends a PATCH request to the resource.
   *
   * This function defaults to a application/json content-type header.
   */
  async patch(body: TPatch): Promise<void> {

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
   */
  async refresh(): Promise<TResource> {

    if (this.inFlightRefresh) {
      return this.inFlightRefresh;
    }

    const refreshFunc = async (): Promise<TResource> => {

      const headers: { [name: string]: string } = {
        Accept: this.contentType ? this.contentType : this.client.representorHelper.getAcceptHeader(),
        ...this.nextRefreshHeaders,
      };

      const response = await this.fetchAndThrow({
        method: 'GET' ,
        headers
      });

      this.nextRefreshHeaders = {};
      this.inFlightRefresh = null;

      const body = await response.text();

      this.repr = this.client.representorHelper.createFromResponse(
        this.uri,
        response,
        body,
      ) as any as Representator<TResource>;

      if (!this.contentType) {
        this.contentType = this.repr.contentType;
      }

      for (const [subUri, subBody] of Object.entries(this.repr.getEmbedded())) {
        const subResource = this.go(subUri);
        subResource.repr = this.client.representorHelper.create(
          subUri,
          this.repr.contentType,
          null,
          new Map(),
        );
        subResource.repr.setBody(subBody);
      }

      return this.repr.getBody();

    };

    const refreshResult = refreshFunc();
    this.inFlightRefresh = refreshResult;

    return refreshResult;

  }

  /**
   * Returns the links for this resource, as a promise.
   *
   * The rel argument is optional. If it's given, we will only return links
   * from that relationship type.
   */
  async links(rel?: string): Promise<Link[]> {

    const r = await this.representation();
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
    return r.getLink(rel);

  }

  /**
   * Follows a relationship, based on its reltype. For example, this might be
   * 'alternate', 'item', 'edit' or a custom url-based one.
   *
   * This function can also follow templated uris. You can specify uri
   * variables in the optional variables argument.
   */
  follow<TFollowedResource = any>(rel: string, variables?: LinkVariables): FollowerOne<TFollowedResource> {

    return new FollowerOne(this, rel, variables);

  }

  /**
   * Follows a relationship based on its reltype. This function returns a
   * Promise that resolves to an array of Resource objects.
   *
   * If no resources were found, the array will be empty.
   */
  followAll<TFollowedResource = any>(rel: string): FollowerMany<TFollowedResource> {

    return new FollowerMany(this, rel);

  }

  /**
   * Resolves a new resource based on a relative uri.
   *
   * Use this function to manually get a Resource object via a uri. The uri
   * will be resolved based on the uri of the current resource.
   *
   * This function doesn't do any HTTP requests.
   */
  go<TGoResource = any>(uri: string): Resource<TGoResource> {

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
  async representation(): Promise<Representator<TResource>> {

    if (!this.repr) {
      await this.refresh();
    }

    return this.repr!;

  }

  /**
   * Clears the internal representation cache.
   */
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


  /**
   * A set of HTTP headers that will be sent along with the next call to Refresh()
   */
  private nextRefreshHeaders: { [name: string]: string };

  /**
   * When a HTTP header gets added here, it will automatically get sent along
   * to the next call to refresh().
   *
   * This means that the next time a GET request is done, these headers will be
   * added. This list gets cleared after the GET request.
   */
  addNextRefreshHeader(name: string, value: string): void {

    this.nextRefreshHeaders[name] = value;

  }

}
