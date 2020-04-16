import * as LinkHeader from 'http-link-header';
import { Link, LinkSet } from '../link';
import { ContentType } from '../types';
import Representor from './base';
import CollectionJsonRepresentor from './collection-json';
import HalRepresentor from './hal';
import HtmlRepresentor from './html';
import JsonApiRepresentor from './jsonapi';
import SirenRepresentor from './siren';

export default class RepresentorHelper {

  private contentTypes: ContentType[];

  constructor(contentTypes: ContentType[]) {

    const defaultTypes: ContentType[] = [
      {
        mime: 'application/hal+json',
        representor: 'hal',
        q: '1.0',
      },
      {
        mime: 'application/vnd.api+json',
        representor: 'jsonapi',
        q: '0.9',
      },
      {
        mime: 'application/vnd.siren+json',
        representor: 'siren',
        q: '0.9',
      },
      {
        mime: 'application/vnd.collection+json',
        representor: 'collection-json',
        q: '0.9',
      },
      {
        mime: 'application/json',
        representor: 'hal',
        q: '0.8',
      },
      {
        mime: 'text/html',
        representor: 'html',
        q: '0.7',
      }

    ];
    this.contentTypes = defaultTypes.concat(contentTypes);

  }

  /**
   * Generates an accept header string, based on registered Resource Types.
   */
  getAcceptHeader(): string {

    return this.contentTypes
      .map( contentType => {
        let item = contentType.mime;
        if (contentType.q) { item += ';q=' + contentType.q; }
        return item;
      } )
      .join(', ');

  }

  getMimeTypes(): string[] {

    return this.contentTypes.map( contentType => contentType.mime );

  }

  create(uri: string, contentType: string, body: string | null, headerLinks: LinkSet): Representor<any> {

    const type = this.getRepresentorType(contentType);

    switch (type) {
      case 'html' :
        return new HtmlRepresentor(uri, contentType, body, headerLinks);
      case 'hal' :
        return new HalRepresentor(uri, contentType, body, headerLinks);
      case 'jsonapi' :
        return new JsonApiRepresentor(uri, contentType, body, headerLinks);
      case 'siren' :
        return new SirenRepresentor(uri, contentType, body, headerLinks);
      case 'collection-json' :
        return new CollectionJsonRepresentor(uri, contentType, body, headerLinks);
      default :
        throw new Error('Unknown representor: ' + type);
    }

  }

  /**
   * Returns a representor object from a Fetch Response.
   */
  createFromResponse(uri: string, response: Response, body: string): Representor<any> {

    const contentType = response.headers.get('Content-Type')!;

    const httpLinkHeader = response.headers.get('Link');
    const headerLinks: LinkSet = new Map();

    if (httpLinkHeader) {

      for (const httpLink of LinkHeader.parse(httpLinkHeader).refs) {
        // Looping through individual links
        for (const rel of httpLink.rel.split(' ')) {
          // Looping through space separated rel values.
          const newLink = new Link({
            rel: rel,
            context: uri,
            href: httpLink.uri,
            title: httpLink.title,
          });
          if (headerLinks.has(rel)) {
            headerLinks.get(rel)!.push(newLink);
          } else {
            headerLinks.set(rel, [newLink]);
          }
        }
      }
    }

    return this.create(uri, contentType, body, headerLinks);

  }

  private getRepresentorType(contentType: string) {

    if (contentType.indexOf(';') !== -1) {
      contentType = contentType.split(';')[0];
    }
    contentType = contentType.trim();
    const result = this.contentTypes.find(item => {
      return item.mime === contentType;
    });

    if (!result) {
      throw new Error('Could not find a representor for contentType: ' + contentType);
    }

    return result.representor;
  }


}
