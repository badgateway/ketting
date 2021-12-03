import { State } from './state';
import * as qs from 'querystring';
import Client from './client';
import { Field } from './field';

export interface ActionInfo {

  /**
   * What url to post the form to.
   */
  uri: string;

  /**
   * Action name.
   *
   * Some formats call this the 'rel'
   */
  name: string | null;

  /**
   * Form title.
   *
   * Should be human-friendly.
   */
  title?: string;

  /**
   * The HTTP method to use
   */
  method: string;

  /**
   * The contentType to use for the form submission
   */
  contentType: string;

  /**
   * Returns the list of fields associated to an action
   */
  fields: Field[];

}

/**
 * An action represents a hypermedia form submission or action.
 */
export interface Action<T extends Record<string, any> = Record<string, any>> extends ActionInfo {

  /**
   * Execute the action or submit the form.
   */
  submit(formData: T): Promise<State>;

}

export class SimpleAction<TFormData extends Record<string, any>> implements Action {

  /**
   * What url to post the form to.
   */
  uri!: string;

  /**
   * Action name.
   *
   * Some formats call this the 'rel'
   */
  name!: string | null;

  /**
   * Form title.
   *
   * Should be human-friendly.
   */
  title!: string;

  /**
   * The HTTP method to use
   */
  method!: string;

  /**
   * The contentType to use for the form submission
   */
  contentType!: string;

  /**
   * Returns the list of fields associated to an action
   */
  fields!: Field[];

  /**
   * Reference to client
   */
  client: Client;

  constructor(client: Client, formInfo: ActionInfo) {
    this.client = client;

    for(const [k, v] of Object.entries(formInfo)) {
      this[k as keyof ActionInfo] = v;
    }

  }

  /**
   * Execute the action or submit the form.
   */
  async submit(formData: TFormData): Promise<State<any>> {

    const uri = new URL(this.uri);

    if (this.method === 'GET') {
      uri.search = qs.stringify(formData);
      const resource = this.client.go(uri.toString());
      return resource.get();
    }
    let body;
    switch (this.contentType) {
      case 'application/x-www-form-urlencoded' :
        body = qs.stringify(formData);
        break;
      case 'application/json':
        body = JSON.stringify(formData);
        break;
      default :
        throw new Error(`Serializing mimetype ${this.contentType} is not yet supported in actions`);
    }
    const response = await this.client.fetcher.fetchOrThrow(uri.toString(), {
      method: this.method,
      body,
      headers: {
        'Content-Type': this.contentType
      }
    });
    const state = this.client.getStateForResponse(uri.toString(), response);
    return state;

  }
}

export class ActionNotFound extends Error {}
