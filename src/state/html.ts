import { BaseState } from './base-state';
import { parseLink } from '../http/util';
import { parseHtml, HtmlForm } from '../util/html';
import { Links } from '../link';
import { Action, SimpleAction, ActionNotFound } from '../action';
import { resolve } from '../util/uri';

/**
 * Represents a resource state in the HAL format
 */
export class HtmlState extends BaseState<string> {

  private forms: HtmlForm[];

  constructor(uri: string, body: string, headers: Headers, links: Links, forms: HtmlForm[]) {

    super(uri, body, headers, links);
    this.forms = forms;

  }

  serializeBody(): string {

    return this.data;

  }

  clone(): HtmlState {

    const state = new HtmlState(
      this.uri,
      this.data,
      new Headers(this.headers),
      new Links(this.uri, this.links),
      this.forms,
    );
    state.client = this.client;
    return state;

  }

  /**
   * Return an action by name.
   *
   * Actions in HTML are HTML <form> tags.
   *
   * If no name is given, the first HTML form is returned.
   */
  action<TFormData = any>(name?: string): Action<TFormData> {

    let resultForm: HtmlForm | null = null;
    if (name === undefined) {
      if (this.forms.length === 0) {
        throw new ActionNotFound('This HTML state does not define any forms.');
      }
      resultForm = this.forms[0];
    } else{
      for (const form of this.forms) {
        if (form.rel === name) {
          resultForm = form;
        }
        if (form.id === name && !resultForm) {
          // Only using the 'id' if we didnt already find one by rel.
          resultForm = form;
        }
      }
    }

    if (!resultForm) {
      throw new ActionNotFound(`Form with name "${name}" not found.`);
    }
    return new SimpleAction(
      this.client,
      resultForm.method || 'GET',
      resolve(this.uri, resultForm.action),
      resultForm.enctype || 'application/x-www-form-urlencoded',
    );

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
    htmlResult.forms,
  );

}
