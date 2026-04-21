import {State} from './interface.js';
import {Resource} from '../resource.js';

export class Resources<T> extends Array<Resource<T>> {

  static get [Symbol.species]() { return Array; }

  constructor(resources: Resource<T>[]) {
    super(resources.length);
    resources.forEach((resource, index) => {
      this[index] = resource;
    });
  }

  public async get(): Promise<State<T>[]> {
    return Promise.all(Array.from(this, resource => resource.get()));
  }
}
