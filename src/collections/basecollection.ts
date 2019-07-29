import { ShardClient } from '../client';


/**
 * Basic Collection Map, the most basic
 * @category Collections
 */
export class BaseCollectionMap<K, V, X = V> extends Map<K, V | X> {
  [Symbol.iterator]: () => IterableIterator<[K, V]>;
  entries!: () => IterableIterator<[K, V]>;
  forEach!: (
    callbackfn: (value: V, key: K, map: BaseCollectionMap<K, V>) => void,
    thisArg?: any,
  ) => void;
  set!: (key: K, value: V) => this;
  values!: () => IterableIterator<V>;
}


/**
 * Basic Collection, used for all the collections
 * @category Collections
 */
export class BaseCollection<K, V, X = V> extends BaseCollectionMap<K, V, X> {
  defaultKey: null | string;

  constructor(
    iterable?: Array<V> | Array<[K, V]> | IterableIterator<V> | IterableIterator<[K, V]> | Map<K, V> | null,
    defaultKey: null | string = 'id',
  ) {
    if (iterable instanceof Map) {
      super(iterable.entries());
    } else {
      if (defaultKey !== null) {
        super();

        if (iterable) {
          for (let value of iterable) {
            const key = (<any> value)[defaultKey];
            this.set(<K> key, <V> value);
          }
        }
      } else {
        super(<any> iterable);
      }
    }
    this.defaultKey = defaultKey;

    Object.defineProperty(this, 'defaultKey', {enumerable: false});
  }

  get length(): number {
    return this.size;
  }

  clone(): BaseCollection<K, V> {
    return new BaseCollection<K, V>(this.entries());
  }

  every(func: any): boolean {
    return this.toArray().every(func);
  }

  filter(key: K | Function, value?: V): Array<V> {
    let func: Function;
    if (typeof(key) === 'function') {
      func = key;
    } else {
      func = (v: V, k?: K): boolean => {
        return this.get(<K> key) === value;
      };
    }
    const map: Array<V> = [];
    for (let [k, v] of this) {
      if (func(v, k)) {
        map.push(v);
      }
    }
    return map;
  }

  find(func: (v: V, k?: K) => boolean): undefined | V {
    for (let [key, value] of this) {
      if (func(value, key)) {
        return value;
      }
    }
  }

  first(): undefined | V {
    return this.values().next().value;
  }

  map(func: (v: V, k?: K) => any): Array<any> {
    const map: Array<V> = [];
    for (let [key, value] of this) {
      map.push(func(value, key));
    }
    return map;
  }

  reduce(cb: any, initialValue?: any): any {
    return this.toArray().reduce(cb, initialValue);
  }

  some(func: (v: V, k?: K) => boolean): boolean {
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
    return `BaseCollection (${this.size} items)`;
  }
}


export interface BaseClientCollectionOptions {
  enabled?: boolean,
}

/**
 * Basic Client Collection, the ShardClient instance is attached to this
 * @category Collections
 */
export class BaseClientCollection<K, V, X = V> extends BaseCollection<K, V, X> {
  client: ShardClient;
  enabled: boolean;

  constructor(
    client: ShardClient,
    options: BaseClientCollectionOptions = {},
  ) {
    super();

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

  clear(shardId?: number): void {
    super.clear();
  }
}
