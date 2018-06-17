/**
 * HttpError extends the Error object, and is thrown wheenever servers emit
 * HTTP errors.
 *
 * It has a response property, allowing users to find out more about the
 * nature of the error.
 *
 * @constructor
 * @param {Response} response
 */
export class HttpError extends Error {

  response: Response;
  status: number;

  constructor(response: Response) {
    super('HTTP error ' + response.status);
    this.response = response;
    this.status = response.status;
  }

}

/**
 * Problem extends the HttpError object. If a server emits a HTTP error, and
 * the response body's content-type is application/problem+json.
 *
 * application/problem+json is defined in RFC7807 and provides a standardized
 * way to describe error conditions by a HTTP server.
 *
 * @constructor
 * @param {Response} response
 * @param {object} problemBody
 */
export class Problem extends HttpError {

  body: {
    title?: string
  };

  constructor(response: Response, problemBody: object) {
    super(response);
    this.body = problemBody;
    if (this.body.title) {
      this.message = 'HTTP Error ' + this.status + ': ' + this.body.title;
    }
  }

}

/**
 * This function creates problems, not unlike the the author of this file.
 *
 * It takes a Fetch Response object, and returns a HttpError. If the HTTP
 * response has a type of application/problem+json it will return a Problem
 * object.
 *
 * Because parsing the response might be asynchronous, the function returns
 * a Promise resolving in either object.
 */
export default async function problemFactory(response: Response): Promise<HttpError | Problem> {

  const contentType = response.headers.get('Content-Type');
  if (contentType && contentType.match(/^application\/problem\+json/i)) {
    const problemBody = await response.json();
    return new Problem(response, problemBody);
  } else {
    return new HttpError(response);
  }

}

