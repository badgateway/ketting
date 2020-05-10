export type HttpHeaders = Record<string, string>;

/**
 * RequestOptions is a set of properties that define
 * a request, or state change.
 *
 * Everything is usually optional.
 */
export type RequestOptions<T = any> = {

  /**
   * Should return a string or a Buffer.
   *
   * Will be used as the body in the HTTP request.
   * If not set, `body` will be used instead.
   */
  serializeBody?: () => string | Buffer;

  /**
   * If set, contains the body of the current state.
   *
   * If body is not a `string` or a `Buffer`, the body will
   * be json encoded.
   */
  data?: T;

  /**
   * List of headers that will be set in the request.
   *
   * If this is not set, we'll fall back to 'headers'
   */
  getContentHeaders?: () => HttpHeaders | Headers,

  /**
   * Full list of HTTP headers.
   */
  headers?: HttpHeaders | Headers;

}

export type GetRequestOptions = Omit<RequestOptions, 'serializeBody' | 'data'>;
export type HeadRequestOptions = GetRequestOptions;
export type PatchRequestOptions<T = any> = RequestOptions<T>;
export type PutRequestOptions<T = any> = RequestOptions<T>;
export type PostRequestOptions<T = any> = RequestOptions<T>;
