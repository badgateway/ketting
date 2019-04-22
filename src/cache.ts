import Resource from './resource';

type CacheEntry = [
  0,
  Resource
] | [
  1,
  Promise<Resource>
];

/**
 * This object is responsible for caching resources.
 *
 * It holds references to all resource objects.
 */
export default class Cache {

  cache: Map<string, CacheEntry>;

  constructor() {

    this.cache = new Map();

  }

}
