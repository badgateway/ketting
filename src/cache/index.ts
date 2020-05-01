export { ForeverCache } from './forever';
import { State } from '../state';

export interface StateCache {

  store: (state: State) => void;
  get: (uri: string) => State | null;
  has: (uri: string) => boolean;
  delete: (uri: string) => void;
  clear: () => void;

}
