import { BaseState } from './base-state';
import { parseLink } from '../http/util';
import { parseHtml, HtmlForm } from '../util/html';
import { ActionInfo } from '../action';
import { resolve } from '../util/uri';
import { StateFactory } from './interface';

/**
 * Turns a HTTP response into a HtmlState
 */
export const factory:StateFactory = async (client, uri, response): Promise<BaseState<string, string>> => {

  const body = await response.text();

  const links = parseLink(uri, response.headers.get('Link'));
  const htmlResult = parseHtml(uri, body);
  links.add(...htmlResult.links);

  return new BaseState({
    client,
    uri,
    data: body,
    headers: response.headers,
    links,
    actions: htmlResult.forms.map(form => formToAction(uri, form)),
  });

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
