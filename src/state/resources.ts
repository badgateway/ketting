import { State } from './interface.js';
import { Resource } from '../resource.js';
import { GetRequestOptions } from '../types.js';

export class Resources<T = any> extends Array<Resource<T>> {

  static get [Symbol.species]() { return Array; }

  constructor(resources: Resource<T>[]) {
    super();
    this.push(...resources);
  }

  public async get(getOptions?: GetRequestOptions): Promise<State<T>[]> {
    return Promise.all(this.map(resource => resource.get(getOptions)));
  }
}
