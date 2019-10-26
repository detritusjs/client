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
    return (<any> this)[convertKey(key)];
  }

  _setFromSnake(key: string, value: any): any {
    return (<any> this)[convertKey(key)] = value;
  }

  difference(key: string, value: any): [boolean, any] {
    if (value !== undefined) {
      const camelKey = convertKey(key);
      const old = (<any> this)[camelKey];
      if (old !== undefined && old !== value) {
        if (!!old !== !!value) {
          return [true, old];
        } else if (old instanceof BaseStructure) {
          let differences = old.differences(value);
          if (differences) {
            return [true, differences];
          }
        } else if (old instanceof BaseCollection) {
          if (old.size !== value.length) {
            return [true, old.clone()];
          } else if (old.size) {
            return [true, old.clone()];
          }
        } else if (old instanceof BaseSet) {
          if (old.size !== value.length) {
            return [true, old.clone()];
          } else {
            if (!value.every((item: any) => old.has(item))) {
              return [true, old.clone()];
            }
          }
        } else if (old instanceof Date) {
          if (value) {
            if (old.getTime() !== (new Date(value)).getTime()) {
              return [true, old];
            }
          } else {
            return [true, old];
          }
        } else if (Array.isArray(old)) {

        } else if (typeof(old) === 'object') {
          if (typeof(value) === 'object') {
            const keys = Object.keys(value);
            if (Object.keys(old).length !== keys.length) {
              return [true, old];
            }
            const matches = keys.every((key: string) => old[key] === value[key]);
            if (!matches) {
              return [true, old];
            }
          } else {
            return [true, old];
          }
        } else {
          if (old !== value) {
            return [true, old];
          }
        }
      }
    }
    return [false, null];
  }

  differences(data: BaseStructureData): null | object {
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

  merge(data: BaseStructureData): void {
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
        obj[key] = this._getFromSnake(key);
      }
    }
    return obj;
  }

  [inspect.custom](): object {
    // https://github.com/abalabahaha/eris/blob/master/lib/structures/Base.js#L59
    const copy = <any> new ({[this.constructor.name]: class {}})[this.constructor.name]();
    if (this._keys) {
      for (let key of this._keys) {
        key = convertKey(key)
        copy[key] = (<any> this)[key];
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
  readonly client: ShardClient;

  constructor(client: ShardClient) {
    super();
    this.client = client;
  }

  get shardId(): number {
    return this.client.shardId;
  }
}
