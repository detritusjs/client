import { ShardClient } from '../client';
import { BaseSet } from '../collections';
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

  constructor() {
    Object.defineProperties(this, {
      _keys: {enumerable: false, writable: true},
      _keysMerge: {enumerable: false, writable: true},
    });
  }

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
        return [true, old];
      }
    }
    return [false, null];
  }

  differences(data: BaseStructureData): null | object {
    let hasDifferences = false;
    const obj: BaseStructureData = {};
    for (let key in data) {
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
    Object.defineProperty(this, 'client', {enumerable: false, writable: false});
  }

  get shardId(): number {
    return this.client.shardId;
  }
}
