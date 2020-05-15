import { State } from './state';

export interface Action<T> {

  submit(formData: T): Promise<State>;

}

export class ActionNotFound extends Error {}
