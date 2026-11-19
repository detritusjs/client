import { inspect } from 'util';

import { ShardClient } from '../client';
// imported from their own modules, the `collections` and `utils` indexes load structures that extend this one (circular import)
import { BaseCollection } from '../collections/basecollection';
import { BaseSet } from '../collections/baseset';
import { DetritusKeys } from '../constants';
import { toCamelCase } from '../utils/casing';


// cache key conversions, capped since `differences()` can be handed arbitrary keys
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
  // on the prototype so instances don't each carry an own `_uncloneable` slot
  Object.defineProperty(structure.prototype, '_uncloneable', {configurable: true, value: true});
}

/**
 * Compares a cached collection with what discord sent (an array, or a collection from `differencesBetween()`)
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
  // components, embeds, and embed fields are keyed by index (ids are always strings), so match those by position
  let isKeyedByIndex = false;
  for (let key of old.keys()) {
    isKeyedByIndex = (typeof(key) === 'number');
    break;
  }
  for (let i = 0; i < value.length; i++) {
    const item = value[i];
    if (isKeyedByIndex) {
      if (!old.has(i) || isItemDifferent(old.get(i), item)) {
        return true;
      }
    } else if (item && typeof(item) === 'object') {
      if (!('id' in item) || !old.has(item.id) || isItemDifferent(old.get(item.id), item)) {
        return true;
      }
    } else if (!old.has(item)) {
      // an array of ids (like `mention_roles`) for a collection keyed by them
      return true;
    }
  }
  return false;
}

/**
 * Copy of a structure that `merge()` won't change, for the old values `difference()` hands back
 * avoids `clone()` since some constructors take a parent structure instead of the client
 */
function snapshotStructure(structure: BaseStructure, copies: Map<BaseStructure, BaseStructure>): BaseStructure {
  let copy = copies.get(structure);
  if (!copy) {
    copy = Object.create(Object.getPrototypeOf(structure)) as BaseStructure;
    copies.set(structure, copy);
    const descriptors = Object.getOwnPropertyDescriptors(structure);
    for (let key in descriptors) {
      // non-enumerable ones are the parent structure (like an overwrite's channel), leave those as is
      const descriptor = descriptors[key];
      if (descriptor.enumerable && descriptor.value instanceof BaseStructure) {
        descriptor.value = snapshotStructure(descriptor.value, copies);
      }
    }
    Object.defineProperties(copy, descriptors);
  }
  return copy;
}

/**
 * The old value `difference()` hands back, collection items are merged into in place so copy those too
 */
function snapshotValue(old: any): any {
  if (old instanceof BaseCollection) {
    const collection = new BaseCollection<any, any>();
    const copies = new Map<BaseStructure, BaseStructure>();
    for (let [key, item] of old) {
      collection.set(key, (item instanceof BaseStructure) ? snapshotStructure(item, copies) : item);
    }
    return collection;
  } else if (old instanceof BaseSet) {
    return old.clone();
  }
  return old;
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
        if (old instanceof BaseStructure && value) {
          const differences = (value instanceof BaseStructure) ? old.differencesBetween(value) : old.differences(value);
          if (differences) {
            return [true, differences];
          }
        } else if (this.hasDifference(key, value)) {
          // through `hasDifference()` so subclass overrides of it count here too
          return [true, snapshotValue(old)];
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

      if (old !== undefined && old !== value) {
        if (typeof(old) === 'bigint') {
          // discord sends these as strings (like permissions), checked first since `0n` is falsy but `"0"` isn't
          return !isSameBigInt(old, value);
        } else if (!!old !== !!value) {
          // so the checks below never compare null to a structure, date, etc
          return true;
        } else if (old instanceof BaseStructure) {
          if (value instanceof BaseStructure) {
            return old.hasDifferencesBetween(value);
          } else {
            return old.hasDifferences(value);
          }
        } else if (old instanceof BaseCollection) {
          return isCollectionDifferent(old, value);
        } else if (old instanceof BaseSet) {
          if (old.size !== value.length) {
            return true;
          } else {
            return !value.every((item: any) => old.has(item));
          }
        } else if (old instanceof Date) {
          if (value instanceof Date) {
            return old.getTime() !== value.getTime();
          } else if (typeof(value) === 'number') {
            return old.getTime() !== value;
          }
          return old.getTime() !== (new Date(value)).getTime();
        } else if (Array.isArray(old)) {
          return isArrayDifferent(old, value);
        } else if (typeof(old) === 'object') {
          // rare, like `role.tags`
          if (typeof(value) === 'object') {
            const oldKeys = Object.keys(old);
            const newKeys = Object.keys(value);
            if (newKeys.length !== oldKeys.length) {
              return true;
            }
            if (!newKeys.every((key: string) => oldKeys.includes(key))) {
              return true;
            }
            return !newKeys.every((key: string) => old[key] === value[key]);
          } else {
            return true;
          }
        } else {
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
   * `toJSON()` for only these keys
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
