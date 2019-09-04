import {
  BaseCollection,
  BaseCollectionMixin,
  BaseCollectionOptions,
} from 'detritus-utils';

import { ShardClient } from '../client';


export {
  BaseCollection,
  BaseCollectionOptions,
};

export class BaseCollectionCache<K, V> extends BaseCollectionMixin<K, V> {
  caches = new BaseCollection<K, BaseCollection<K, V>>();
  options: BaseCollectionOptions = {};

  constructor(options?: BaseCollectionOptions) {
    super();
    Object.assign(this.options, options);

    Object.defineProperties(this, {
      caches: {enumerable: false},
      options: {enumerable: false},
    });
  }

  get size(): number {
    let size = 0;
    for (let [cacheKey, cache] of this.caches) {
      size += cache.size;
    }
    return size;
  }

  clear(): void {
    return this.caches.clear();
  }

  delete(cacheKey: K): boolean;
  delete(cacheKey: K, key: K): boolean;
  delete(cacheKey: null | undefined, key: K): boolean;
  delete(cacheKey?: K | null, key?: K | null): boolean {
    if (cacheKey) {
      if (key) {
        const cache = this.caches.get(cacheKey);
        if (cache) {
          return cache.delete(key);
        }
      } else {
        return this.caches.delete(cacheKey);
      }
    } else if (key) {
      let deleted = false;
      for (let [ck, cache] of this.caches) {
        if (cache.delete(key)) {
          deleted = true;
        }
      }
      return deleted;
    }
    return false;
  }

  forEach(func: (v: V, k: K, map: Map<K, V>) => void, thisArg?: any): void {
    for (let [cacheKey, cache] of this.caches) {
      for (let [k, v] of cache) {
        func.call(thisArg, v, k, cache);
      }
    }
  }

  get(cacheKey: K): BaseCollection<K, V> | undefined;
  get(cacheKey: K, key: K): V | undefined;
  get(cacheKey: null | undefined, key: K): V | undefined;
  get(cacheKey?: K | null, key?: K | null): BaseCollection<K, V> | V | undefined {
    if (cacheKey) {
      const cache = this.caches.get(cacheKey);
      if (key) {
        if (cache) {
          return cache.get(key);
        }
      } else {
        return cache;
      }
    } else if (key) {
      for (let [k, v] of this) {
        if (k === key) {
          return v;
        }
      }
    }
    return undefined;
  }

  has(cacheKey: K): boolean;
  has(cacheKey: K, key: K): boolean;
  has(cacheKey: null | undefined, key: K): boolean;
  has(cacheKey?: K | null, key?: K | null): boolean {
    if (cacheKey) {
      if (key) {
        const cache = this.caches.get(cacheKey);
        if (cache) {
          return cache.has(key);
        }
      } else {
        return this.caches.has(cacheKey);
      }
    } else if (key) {
      for (let [k, v] of this) {
        if (k === key) {
          return true;
        }
      }
    }
    return false;
  }

  insertCache(cacheKey: K): BaseCollection<K, V> {
    let cache = this.caches.get(cacheKey);
    if (!cache) {
      cache = new BaseCollection(this.options);
      this.caches.set(cacheKey, cache);
    }
    return cache;
  }

  set(cacheKey: K, key: K, value: V): this {
    const cache = this.insertCache(cacheKey);
    cache.set(key, value);
    return this;
  }

  some(func: (v: V, k: K) => boolean): boolean {
    for (let [key, value] of this) {
      if (func(value, key)) {
        return true;
      }
    }
    return false;
  }

  *keys(): IterableIterator<K> {
    for (let cache of this.caches.values()) {
      for (let key of cache.keys()) {
        yield key;
      }
    }
  }

  *values(): IterableIterator<V> {
    for (let cache of this.caches.values()) {
      for (let value of cache.values()) {
        yield value;
      }
    }
  }

  *[Symbol.iterator](): IterableIterator<[K, V]> {
    for (let [cacheKey, cache] of this.caches) {
      for (let [key, value] of cache) {
        yield [key, value];
      }
    }
  }

  get [Symbol.toStringTag](): string {
    return `BaseCollectionCache (${this.caches.size.toLocaleString()} caches, ${this.size.toLocaleString()} items)`;
  }
}


export interface BaseClientCollectionOptions extends BaseCollectionOptions {
  enabled?: boolean,
}

/**
 * Basic Client Collection, the ShardClient instance is attached to this
 * @category Collections
 */
export class BaseClientCollection<K, V> extends BaseCollection<K, V> {
  client: ShardClient;
  enabled: boolean;

  constructor(
    client: ShardClient,
    options: BaseClientCollectionOptions | boolean = {},
  ) {
    if (typeof(options) === 'boolean') {
      options = {enabled: options};
    }
    super(options);

    this.client = client;
    this.enabled = !!(options.enabled || options.enabled === undefined);

    Object.defineProperties(this, {
      client: {enumerable: false, writable: false},
      enabled: {configurable: true, writable: false},
    });
  }

  setEnabled(value: boolean) {
    Object.defineProperty(this, 'enabled', {value});
  }
}


/**
 * Basic Client Cache Collection, the ShardClient instance is attached to this
 * @category Collections
 */
export class BaseClientCollectionCache<K, V> extends BaseCollectionCache<K, V> {
  client: ShardClient;
  enabled: boolean;

  constructor(
    client: ShardClient,
    options: BaseClientCollectionOptions = {},
  ) {
    super(options);

    this.client = client;
    this.enabled = !!(options.enabled || options.enabled === undefined);

    Object.defineProperties(this, {
      client: {enumerable: false, writable: false},
      enabled: {configurable: true, writable: false},
    });
  }

  setEnabled(value: boolean) {
    Object.defineProperty(this, 'enabled', {value});
  }
}
