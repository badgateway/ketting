export { ForeverCache } from './forever';
import { State } from '../state';

export interface StateCache {

  store: (state: State) => void;
  get: (uri: string) => State | null
  delete: (uri: string) => void;
  clear: () => void;

  processRequest: (request: Request, response: Response) => void;

}
