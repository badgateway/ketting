import Link from '../link';


/**
 * The Representation class is basically a 'body' of a request
 * or response.
 *
 * This is base class for a representation.
 */
export default class Representation {

  body: any
  contentType: string
  embedded: {
    [uri: string]: object
  }
  links: Link[]
  uri: string

  constructor(uri: string, contentType: string, body: any) {

    this.uri = uri;
    this.contentType = contentType;
    this.body = body;
    this.links = [];
    this.embedded = {};

  }

};
