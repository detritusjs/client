import { inspect } from 'util';

import { ShardClient } from '../client';
// imported from their own modules, the `collections` and `utils` indexes load structures that extend this one (circular import)
import { BaseCollection } from '../collections/basecollection';
import { BaseSet } from '../collections/baseset';
import { DetritusKeys } from '../constants';
import { toCamelCase } from '../utils/casing';


// every merge/difference converts each key, so remember the conversions
// capped since `differences()` can be handed objects with arbitrary keys
const convertedKeys = new Map<string, string>();
const CONVERTED_KEYS_LIMIT = 4096;

export function convertKey(snake: string): string {
  let camel = convertedKeys.get(snake);
  if (camel === undefined) {
    if (snake in DetritusKeys) {
      camel = (DetritusKeys as any)[snake] as string;
    } else {
      camel = toCamelCase(snake);
    }
    if (convertedKeys.size < CONVERTED_KEYS_LIMIT) {
      convertedKeys.set(snake, camel);
    }
  }
  return camel;
}


export type StructureKeysName = '_keys' | '_keysMerge' | '_keysSkipDifference';

/**
 * Store a structure's keys on its prototype, a class field would put a copy on every instance
 * @ignore
 */
export function setStructureKeys(structure: Function, name: StructureKeysName, keys: BaseSet<string>): void {
  // writable so subclasses can still assign their own keys
  Object.defineProperty(structure.prototype, name, {configurable: true, value: keys, writable: true});
}

export function setStructureUncloneable(structure: Function): void {
  // on the prototype so every instance doesn't carry its own `_uncloneable` slot (class fields are own properties)
  Object.defineProperty(structure.prototype, '_uncloneable', {configurable: true, value: true});
}

/**
 * Compares a cached collection with what discord sent (usually an array of objects with an `id`, or another collection from `differencesBetween()`)
 * entries we can't match up by id (like embeds, keyed by their index) still count as different
 */
function isCollectionDifferent(old: BaseCollection<any, any>, value: any): boolean {
  if (value instanceof BaseCollection) {
    if (old.size !== value.size) {
      return true;
    }
    for (let [key, item] of value) {
      if (!old.has(key)) {
        return true;
      }
      if (isItemDifferent(old.get(key), item)) {
        return true;
      }
    }
    return false;
  }
  if (!Array.isArray(value) || old.size !== value.length) {
    return true;
  }
  for (let item of value) {
    if (!item || typeof(item) !== 'object' || !('id' in item) || !old.has(item.id)) {
      return true;
    }
    if (isItemDifferent(old.get(item.id), item)) {
      return true;
    }
  }
  return false;
}

function isArrayDifferent(old: Array<any>, value: any): boolean {
  if (!Array.isArray(value) || old.length !== value.length) {
    return true;
  }
  for (let i = 0; i < old.length; i++) {
    if (isItemDifferent(old[i], value[i])) {
      return true;
    }
  }
  return false;
}

function isItemDifferent(old: any, item: any): boolean {
  if (old instanceof BaseStructure) {
    return (item instanceof BaseStructure) ? old.hasDifferencesBetween(item) : old.hasDifferences(item);
  }
  if (old && typeof(old) === 'object') {
    // some raw object we don't know how to compare
    return true;
  }
  // primitives (ids, numbers like colors)
  return old !== item;
}

function isSameBigInt(old: bigint, value: any): boolean {
  if (typeof(value) === 'bigint') {
    return old === value;
  }
  if (value === null || value === '') {
    return false;
  }
  try {
    return old === BigInt(value);
  } catch(error) {
    // not something BigInt() can parse, so it can't be the same value
    return false;
  }
}


export interface BaseStructureData {
  [key: string]: any,
}

/**
 * The most basic Structure class, every structure extends this
 * @category Structure
 */
export class Structure {
  // declared only, these live on the prototype (see `setStructureKeys`) instead of on every instance
  /** @ignore */
  declare readonly _keys?: BaseSet<string>;
  /** @ignore */
  declare readonly _keysMerge?: BaseSet<string>;
  /** @ignore */
  declare readonly _keysSkipDifference?: BaseSet<string>;

  _getFromSnake(key: string): any {
    return (this as any)[convertKey(key)];
  }

  _setFromSnake(key: string, value: any): any {
    return (this as any)[convertKey(key)] = value;
  }

  difference(key: string, value: any): [boolean, any] {
    if (value !== undefined) {
      const camelKey = convertKey(key);
      const old = (this as any)[camelKey];
      if (old !== undefined && old !== value) {
        if (typeof(old) === 'bigint') {
          // checked before the truthy compare since `0n` is falsy but its string form `"0"` isn't
          if (this.hasDifference(key, value)) {
            return [true, old];
          }
        } else if (!!old !== !!value) {
          return [true, old];
        } else if (old instanceof BaseStructure) {
          // `differencesBetween()` when comparing two structures (from `differencesBetween()`), `differences()` for raw data
          const differences = (value instanceof BaseStructure) ? old.differencesBetween(value) : old.differences(value);
          if (differences) {
            return [true, differences];
          }
        } else if (this.hasDifference(key, value)) {
          if (old instanceof BaseCollection) {
            return [true, old.clone()];
          } else if (old instanceof BaseSet) {
            return [true, old.clone()];
          } else {
            return [true, old];
          }
        }
      }
    }
    return [false, null];
  }

  differences(data?: BaseStructureData): null | object {
    let hasDifferences = false;
    const obj: BaseStructureData = {};
    for (let key in data) {
      if (this._keysSkipDifference && this._keysSkipDifference.has(key)) {
        continue;
      }
      const [hasDifference, difference] = this.difference(key, data[key]);
      if (hasDifference) {
        obj[convertKey(key)] = difference;
        hasDifferences = true;
      }
    }
    if (hasDifferences) {
      return obj;
    }
    return null;
  }

  differencesBetween(structure: Structure): null | object {
    let hasDifferences = false;
    const obj: BaseStructureData = {};
    if (this._keys) {
      for (let key of this._keys) {
        if (this._keysSkipDifference && this._keysSkipDifference.has(key)) {
          continue;
        }
        const [ hasDifference, difference ] = this.difference(key, structure._getFromSnake(key));
        if (hasDifference) {
          obj[convertKey(key)] = difference;
          hasDifferences = true;
        }
      }
    }
    if (hasDifferences) {
      return obj;
    }
    return null;
  }

  hasDifference(key: string, value: any): boolean {
    if (value !== undefined) {
      const camelKey = convertKey(key);
      const old = (this as any)[camelKey];

      // BigInts
      // -> Discord sends us a string version of this (like permissions)
      // -> Parse it as BigInt before comparing
      // Arrays
      // -> We either receive [string|int] or [{id: string}] or other arrays from discord
      // -> We either parse them as BaseSet or BaseCollection with the ID as the key (sometimes the key is the array number like embeds)
      if (old !== undefined && old !== value) {
        if (typeof(old) === 'bigint') {
          // assume we got a BigInt in a string
          // checked before the truthy compare since `0n` is falsy but its string form `"0"` isn't
          return !isSameBigInt(old, value);
        } else if (!!old !== !!value) {
          // this makes sure we dont compare null to BaseStructure, null to Date, etc..
          return true;
        } else if (old instanceof BaseStructure) {
          // assume it's either an object or a BaseStructure
          if (value instanceof BaseStructure) {
            return old.hasDifferencesBetween(value);
          } else {
            return old.hasDifferences(value);
          }
        } else if (old instanceof BaseCollection) {
          return isCollectionDifferent(old, value);
        } else if (old instanceof BaseSet) {
          // assume we got an array of [string] or [int]
          if (old.size !== value.length) {
            return true;
          } else {
            return !value.every((item: any) => old.has(item));
          }
        } else if (old instanceof Date) {
          // assume we either got a Date, Int, or Date String
          if (value instanceof Date) {
            // we got a Date object, usually from Structure.differencesBetween(Structure)
            return old.getTime() !== value.getTime();
          } else if (typeof(value) === 'number') {
            // we got a number, unsure of from where but might as well check
            return old.getTime() !== value;
          }
          return old.getTime() !== (new Date(value)).getTime();
        } else if (Array.isArray(old)) {
          return isArrayDifferent(old, value);
        } else if (typeof(old) === 'object') {
          // assume we got an object too
          // this would be a rare compare, like role.tags
          if (typeof(value) === 'object') {
            // compare keys length to each other
            const oldKeys = Object.keys(old);
            const newKeys = Object.keys(value);
            if (newKeys.length !== oldKeys.length) {
              return true;
            }
            // see if both objects have the same keys
            if (!newKeys.every((key: string) => oldKeys.includes(key))) {
              return true;
            }
            // compare each value inside of the object
            return !newKeys.every((key: string) => old[key] === value[key]);
          } else {
            return true;
          }
        } else {
          // good old compare
          return old !== value;
        }
      }
    }
    return false;
  }

  hasDifferences(data?: BaseStructureData): boolean {
    if (data) {
      for (let key in data) {
        if (this._keysSkipDifference && this._keysSkipDifference.has(key)) {
          continue;
        }
        const hasDifference = this.hasDifference(key, data[key]);
        if (hasDifference) {
          return true;
        }
      }
    }
    return false;
  }

  hasDifferencesBetween(structure: Structure): boolean {
    if (this._keys) {
      for (let key of this._keys) {
        if (this._keysSkipDifference && this._keysSkipDifference.has(key)) {
          continue;
        }
        const hasDifference = this.hasDifference(key, structure._getFromSnake(key));
        if (hasDifference) {
          return true;
        }
      }
    }
    return false;
  }

  merge(data?: BaseStructureData): void {
    if (!data) {
      return;
    }
    if (this._keys) {
      if (this._keysMerge) {
        for (let key of this._keysMerge) {
          if (this._keys.has(key)) {
            this.mergeValue(key, data[key]);
          }
        }
      }
      for (let key in data) {
        if (this._keysMerge && this._keysMerge.has(key)) {
          continue;
        }
        if (this._keys.has(key)) {
          let value = data[key];
          if (value instanceof BaseStructure) {
            this._setFromSnake(key, value);
            continue;
          }
          this.mergeValue(key, value);
        }
      }
    }
  }

  mergeValue(key: string, value: any): void {
    if (value !== undefined) {
      this._setFromSnake(key, value);
    }
  }

  toJSON(): object {
    return this._toJSONKeys(this._keys);
  }

  /**
   * `toJSON()` for only some of the keys, only these keys' values are read
   * @ignore
   */
  _toJSONKeys(keys?: Iterable<string>): BaseStructureData {
    const obj: BaseStructureData = {};
    if (keys) {
      for (let key of keys) {
        let value = this._getFromSnake(key);
        if (typeof(value) === 'bigint') {
          value = String(value);
        } else if (value instanceof Structure) {
          value = value.toJSON();
        } else if (Array.isArray(value) && value.some((x) => x instanceof Structure)) {
          value = value.map((x) => {
            if (x instanceof Structure) {
              return x.toJSON();
            }
            return x;
          });
        }
        obj[key] = value;
      }
    }
    return obj;
  }

  [inspect.custom](): object {
    // https://github.com/abalabahaha/eris/blob/master/lib/structures/Base.js#L59
    const copy = new ({[this.constructor.name]: class {}})[this.constructor.name]() as any;
    if (this._keys) {
      for (let key of this._keys) {
        key = convertKey(key)
        copy[key] = (this as any)[key];
      }
    }
    return copy;
  }
}


/**
 * Basic Structure class with an added ShardClient attached to it
 * @category Structure
 */
export class BaseStructure extends Structure {
  /** @ignore */
  declare readonly _clone?: boolean;
  /** @ignore */
  declare readonly _uncloneable?: boolean;

  readonly client: ShardClient;

  constructor(client: ShardClient, data?: BaseStructureData, isClone?: boolean) {
    super();
    this.client = client;
    this._clone = isClone;
    if (data) {
      this.merge(data);
    }
  }

  get isClone(): boolean {
    return !!this._clone;
  }

  get shardId(): number {
    return this.client.shardId;
  }

  clone(): this {
    if (this._uncloneable) {
      throw new Error('Cannot clone this object');
    }
    const ClonedStructure = this.constructor as { new(...args: ConstructorParameters<typeof BaseStructure>): any };
    return new ClonedStructure(this.client, JSON.parse(JSON.stringify(this)), true);
  }
}
