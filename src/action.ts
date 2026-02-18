import { State } from './state';
import * as qs from 'querystring';
import Client from './client';
import { Field } from './field';
import Resource from './resource';

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

  /**
   * Return a field by name.
   */
  field(name: string): Field | undefined;

  /**
   * Execute the action or submit the form, then return the next resource.
   *
   * If a server responds with a 201 Status code and a Location header,
   * it will automatically return the newly created resource.
   *
   * If the server responded with a 204 or 205, this function will return
   * `this`.
   */
  submitFollow(formData: T): Promise<Resource>;
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

    const newFormData = this.validateForm(formData);

    if (this.method === 'GET') {
      uri.search = qs.stringify(newFormData);
      const resource = this.client.go(uri.toString());
      return resource.get();
    }
    const response = await this.fetchOrThrowWithBody(uri, newFormData);
    const state = this.client.getStateForResponse(uri.toString(), response);
    return state;
  }

  async submitFollow(formData: TFormData): Promise<Resource> {
    const uri = new URL(this.uri);

    const newFormData = this.validateForm(formData);

    if (this.method === 'GET') {
      uri.search = qs.stringify(newFormData);
      return this.client.go(uri.toString());
    }

    const response = await this.fetchOrThrowWithBody(uri, newFormData);
    switch (response.status) {
      case 201:
        if (response.headers.has('location')) {
          return this.client.go(response.headers.get('location')!);
        }
        throw new Error('Could not follow after a 201 request, because the server did not reply with a Location header. If you sent a Location header, check if your service is returning "Access-Control-Expose-Headers: Location".');
      case 204 :
      case 205 :
        return this.client.go(uri.toString());
      default:
        throw new Error('Did not receive a 201, 204 or 205 status code so we could not follow to the next resource');
    }
  }

  private validateForm(formData: TFormData): TFormData {
    const newFormData: TFormData = {
      ...formData
    };

    for (const field of this.fields) {

      if (!(field.name in formData)) {

        if (field.value) {
          // We don't have perfect types for fields vs. FormData and how they
          // related, so 'any' is needed here.
          (newFormData as any)[field.name] = field.value;
        } else if (field.required) {
          throw new Error(`The ${field.name} field is required in this form`);
        }

      }

    }
    return newFormData;
  }

  private fetchOrThrowWithBody(uri: URL, formData: TFormData): Promise<Response> {
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
    return this.client.fetcher.fetchOrThrow(uri.toString(), {
      method: this.method,
      body,
      headers: {
        'Content-Type': this.contentType
      }
    });
  }

  field(name: string): Field | undefined {
    return this.fields.find(field => field.name === name);
  }
}

export class ActionNotFound extends Error {}
