import { BaseState } from './base-state';
import { parseLink } from '../http/util';
import { parseHtml, HtmlForm } from '../util/html';
import { Links } from '../link';
import { ActionInfo } from '../action';
import { resolve } from '../util/uri';

/**
 * Represents a resource state in the HAL format
 */
export class HtmlState extends BaseState<string> {

  serializeBody(): string {

    return this.data;

  }

  clone(): HtmlState {

    const state = new HtmlState(
      this.uri,
      this.data,
      new Headers(this.headers),
      new Links(this.uri, this.links),
      [],
      this.actionInfo,
    );
    state.client = this.client;
    return state;

  }

}

/**
 * Turns a HTTP response into a HtmlState
 */
export const factory = async (uri: string, response: Response): Promise<HtmlState> => {

  const body = await response.text();

  const links = parseLink(uri, response.headers.get('Link'));
  const htmlResult = parseHtml(uri, body);
  links.add(...htmlResult.links);

  return new HtmlState(
    uri,
    body,
    response.headers,
    links,
    [],
    htmlResult.forms.map(form => formToAction(uri, form)),
  );

};

function formToAction(context: string, form: HtmlForm): ActionInfo {

  return {
    uri: resolve(context, form.action),
    name: form.rel || form.id || '',
    method: form.method || 'GET',
    contentType: form.enctype || 'application/x-www-form-urlencoded',
    // Fields are not yet supported :(
    fields: [],
  };
}
