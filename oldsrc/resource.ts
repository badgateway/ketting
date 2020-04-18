import Ketting from './ketting';
import Representator from './representor/base';
import { LinkVariables } from './types';

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
  refresh(): Promise<TResource> {

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
   * Clears the internal representation cache.
   */
  clearCache(): void {

    this.repr = null;

  }

}
