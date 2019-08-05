/**
 * Basic Set, used for guild features
 * @category Collections
 */
export class BaseSet<V> extends Set<V> {
  get length(): number {
    return this.size;
  }

  clone(): BaseSet<V> {
    return new BaseSet<V>(this.values());
  }

  every(func: any): boolean {
    return this.toArray().every(func);
  }

  filter(func: (v: V) => boolean): Array<V> {
    const map: Array<V> = [];
    for (let value of this) {
      if (func(value)) {
        map.push(value);
      }
    }
    return map;
  }

  find(func: (v: V) => boolean): undefined | V {
    for (let value of this) {
      if (func(value)) {
        return value;
      }
    }
  }

  first(): undefined | V {
    return this.values().next().value;
  }

  map(func: (v: V) => any): Array<any> {
    const map: Array<any> = [];
    for (let value of this) {
      map.push(func(value));
    }
    return map;
  }

  reduce(cb: any, initialValue?: any): any {
    return this.toArray().reduce(cb, initialValue);
  }

  some(func: (v: V) => boolean): boolean {
    for (let value of this) {
      if (func(value)) {
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
    return `BaseSet (${this.size} items)`;
  }
}
