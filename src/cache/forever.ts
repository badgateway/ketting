import { StateCache } from './';
import { State } from '../state';
import { isSafeMethod } from '../http/util';
import * as LinkHeader from 'http-link-header';
import { resolve } from '../util/uri';

export class ForeverCache implements StateCache {

  private cache: Map<string, State>;

  constructor() {
    this.cache = new Map();
  }

  store(state: State) {
    this.cache.set(state.uri, state);
  }

  get(uri: string): State | null {

    return this.cache.get(uri) || null;

  }

  has(uri: string): boolean {

    return this.cache.has(uri);

  }

  delete(uri: string) {
    this.cache.delete(uri);
  }

  clear() {
    this.cache.clear();
  }

  processRequest(request: Request, response: Response): void {

    if (isSafeMethod(request.method)) {
      return;
    }
    this.delete(request.url);

    if (response.headers.has('Link')) {
      for (const httpLink of LinkHeader.parse(response.headers.get('Link')!).rel('invalidates')) {
        const uri = resolve(request.url, httpLink.uri);
        this.cache.delete(uri);
      }
    }
  }

}
