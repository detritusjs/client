import { inspect } from 'util';

import { ShardClient } from '../client';
import { BaseCollection, BaseSet } from '../collections';
import { DetritusKeys } from '../constants';
import { toCamelCase } from '../utils';


export function convertKey(snake: string): string {
  if (snake in DetritusKeys) {
    return DetritusKeys[snake];
  }
  return toCamelCase(snake);
}


export interface BaseStructureData {
  [key: string]: any,
}

/**
 * The most basic Structure class, every structure extends this
 * @category Structure
 */
export class Structure {
  /** @ignore */
  readonly _keys?: BaseSet<string>;
  /** @ignore */
  readonly _keysMerge?: BaseSet<string>;
  /** @ignore */
  readonly _keysSkipDifference?: BaseSet<string>;

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
        if (!!old !== !!value) {
          return [true, old];
        } else if (old instanceof BaseStructure) {
          const differences = old.differences(value);
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
        if (!!old !== !!value) {
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
          // assume we got an array, maybe try looking to see if each object has {id}?
          if (old.size !== value.length) {
            // compare sizes first
            return true;
          } else if (old.size) {
            // unknown of how to compare, so just see if the BaseCollection has a size
            return true;
          }
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
            return old.getTime() === value.getTime();
          } else if (typeof(value) === 'number') {
            // we got a number, unsure of from where but might as well check
            return old.getTime() !== value;
          }
          return old.getTime() !== (new Date(value)).getTime();
        } else if (Array.isArray(old)) {
          // assume we got an array of something
          if (old.length !== value.length) {
            // compare sizes first
            return true;
          } else if (old.length) {
            // unknown of how to compare, so just see if the Array has a size
            return true;
          }
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
            return newKeys.every((key: string) => old[key] === value[key]);
          } else {
            return true;
          }
        } else if (typeof(old) === 'bigint') {
          // assume we got a BigInt in a string
          return old !== BigInt(value);
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
    const obj: BaseStructureData = {};
    if (this._keys) {
      for (let key of this._keys) {
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
  readonly _clone?: boolean;
  /** @ignore */
  readonly _uncloneable?: boolean;

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
