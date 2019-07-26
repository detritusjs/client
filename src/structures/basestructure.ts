import { Client as ShardClient } from '../client';
import { toCamelCase } from '../utils';


export interface BaseStructureData {
  [key: string]: any,
}

export class BaseStructure {
  readonly _defaultKeys: ReadonlyArray<string> | null = null;
  readonly _ignoreKeys: ReadonlyArray<string> | null = null;
  readonly client: ShardClient;

  constructor(client: ShardClient) {
    this.client = client;

    Object.defineProperties(this, {
      _defaultKeys: {enumerable: false},
      _ignoreKeys: {enumerable: false},
      client: {enumerable: false, writable: false},
    });
  }

  initialize(data: BaseStructureData): void {
    if (this._defaultKeys !== null) {
      for (let key of this._defaultKeys) {
        if (this._ignoreKeys === null || !this._ignoreKeys.includes(key)) {
          this.mergeValue(key, data[key]);
        }
      }
    }
  }

  get shardId(): number {
    return this.client.shardId;
  }

  _getFromSnake(key: string): any {
    return (<any> this)[toCamelCase(key)];
  }

  _setFromSnake(key: string, value: any): any {
    return (<any> this)[toCamelCase(key)] = value;
  }

  difference(key: string, value: any): [boolean, any] {
    if (value !== undefined) {
      const camelKey = toCamelCase(key);
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
        obj[toCamelCase(key)] = difference;
        hasDifferences = true;
      }
    }
    if (hasDifferences) {
      return obj;
    }
    return null;
  }

  merge(data: BaseStructureData, skip?: Array<string>): void {
    for (let key in data) {
      if (skip !== undefined && skip.includes(key)) {
        continue;
      }
      let value = data[key];
      if (value instanceof BaseStructure) {
        this._setFromSnake(key, value);
        continue;
      }
      this.mergeValue(key, value);
    }
  }

  mergeValue(key: string, value: any): void {
    if (value !== undefined) {
      if (this._defaultKeys !== null && this._defaultKeys.includes(key)) {
        this._setFromSnake(key, value);
      } else {
        if (this.constructor.name !== 'Presence') {
          console.log(this.constructor.name, 'unknown key', key, value);
        }
      }
    }
  }

  toJSON(): object {
    const obj: BaseStructureData = {};
    if (this._defaultKeys !== null) {
      for (let key of this._defaultKeys) {
        obj[key] = this._getFromSnake(key);
      }
    }
    return obj;
  }
}
