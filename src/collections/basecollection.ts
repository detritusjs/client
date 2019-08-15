import { Timers } from 'detritus-utils';

import { ShardClient } from '../client';


export class BaseCollectionMixin<K, V> {
  get length(): number {
    return this.size;
  }

  get size(): number {
    return 0;
  }

  clear(): void {
    
  }

  entries(): IterableIterator<[K, V]> {
    return this[Symbol.iterator]();
  }

  every(func: (v: V, k: K) => boolean): boolean {
    for (let [key, value] of this) {
        if (!func(value, key)) {
          return false;
      }
    }
    return true;
  }

  filter(func: (v: V, k: K) => boolean): Array<V> {
    const map = [];
    for (let [key, value] of this) {
      if (func(value, key)) {
        map.push(value);
      }
    }
    return map;
  }

  find(func: (v: V, k: K) => boolean): V | undefined {
    for (let [key, value] of this) {
      if (func(value, key)) {
        return value;
      }
    }
    return undefined;
  }

  first(): V | undefined {
    for (let [key, value] of this) {
      return value;
    }
  }

  forEach(func: (v: V, k: K, map: Map<K, V>) => void, thisArg?: any): void {

  }

  map(func: (v: V, k: K) => any): Array<any> {
    const map = [];
    for (let [key, value] of this) {
        map.push(func(value, key));
    }
    return map;
  }

  reduce(func: (intial: any, v: V) => any, initialValue?: any): any {
    let reduced = initialValue;
    for (let [key, value] of this) {
      reduced = func(reduced, value);
    }
    return reduced;
  }

  some(func: (v: V, k: K) => boolean): boolean {
    for (let [key, value] of this) {
        if (func(value, key)) {
            return true;
        }
    }
    return false;
  }

  toArray(): Array<V> {
    return Array.from(this.values());
  }

  toJSON(): Array<V> {
    return this.toArray();
  }

  toString(): string {
    return this[Symbol.toStringTag];
  }

  *keys(): IterableIterator<K> {

  }

  *values(): IterableIterator<V> {

  }

  *[Symbol.iterator](): IterableIterator<[K, V]> {
    
  }

  get [Symbol.toStringTag]() {
    return 'BaseCollection';
  }
}


export interface BaseCollectionOptions {
  expire?: number,
  intervalTime?: number,
  limit?: number,
}

export class BaseCollection<K, V> extends BaseCollectionMixin<K, V> {
  cache = new Map<K, V>();
  expire: number = 0;
  lastUsed = new Map<K, number>();
  interval = new Timers.Interval();
  intervalTime = 5000;
  limit: number = 0;

  constructor({expire, intervalTime, limit}: BaseCollectionOptions = {}) {
    super();

    this.expire = (expire === undefined) ? this.expire : expire;
    this.intervalTime = (intervalTime === undefined) ? this.intervalTime : intervalTime;
    this.limit = (limit === undefined) ? this.limit : limit;

    Object.defineProperties(this, {
      cache: {enumerable: false},
      lastUsed: {enumerable: false},
      interval: {enumerable: false},
    });
  }

  startInterval(expire: number) {
    if (expire) {
      this.interval.start(this.intervalTime, () => {
        const now = Date.now();
        for (let [key, lastUsed] of this.lastUsed) {
          if (expire < now - lastUsed) {
            this.delete(key);
          }
        }
      });
    } else {
      this.interval.stop();
    }
  }

  stopInterval() {
    this.interval.stop();
  }

  get size(): number {
    return this.cache.size;
  }

  clear(): void {
    this.cache.clear();
    this.lastUsed.clear();
    this.stopInterval();
  }

  clone(): BaseCollection<K, V> {
    const collection = new BaseCollection<K, V>(this);
    for (let [key, value] of this) {
      collection.set(key, value);
    }
    return collection;
  }

  delete(key: K): boolean {
    const deleted = this.cache.delete(key);
    this.lastUsed.delete(key);
    if (!this.cache.size) {
      this.stopInterval();
    }
    return deleted;
  }

  forEach(func: (v: V, k: K, map: Map<K, V>) => void, thisArg?: any): void {
    return this.cache.forEach(func, thisArg);
  }

  get(key: K): V | undefined {
    if (this.expire && this.cache.has(key)) {
      this.lastUsed.set(key, Date.now());
    }
    return this.cache.get(key);
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  keys(): IterableIterator<K>  {
    return this.cache.keys();
  }

  set(key: K, value: V): this {
    this.cache.set(key, value);
    if (this.expire) {
      this.lastUsed.set(key, Date.now());
      if (!this.interval.hasStarted) {
        this.startInterval(this.expire);
      }
    }
    return this;
  }

  values(): IterableIterator<V> {
    return this.cache.values();
  }

  [Symbol.iterator](): IterableIterator<[K, V]> {
    return this.cache[Symbol.iterator]();
  }

  get [Symbol.toStringTag](): string {
    return `BaseCollection (${this.size.toLocaleString()} items)`;
  }
}


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
