import * as PermissionTools from './permissions';
import * as Snowflake from './snowflake';

export {
  PermissionTools,
  Snowflake,
};

export function anyToCamelCase(object: any, skip?: Array<string>): any {
  if (object === null) {
    return object;
  }
  if (typeof(object) === 'object') {
    if (Array.isArray(object)) {
      const obj: Array<any> = [];
      for (let value of object) {
        obj.push(anyToCamelCase(value));
      }
      return obj;
    } else {
      const obj: {[key: string]: any} = {};
      for (let key in object) {
        if (skip && skip.includes(key)) {
          obj[key] = object[key];
        } else {
          obj[toCamelCase(key)] = anyToCamelCase(object[key]);
        }
      }
      return obj;
    }
  }
  return object;
}

export function getAcronym(name?: string): string {
  if (name != null) {
    return name.replace(/\w+/g, match => match[0]).replace(/\s/g, '');
  }
  return '';
}

export function hexToInt(hex: string): number {
  return parseInt(hex.replace(/#/, ''), 16);
}

export function intToHex(int: number, hashtag?: boolean): string {
  return ((hashtag) ? '#' : '') + int.toString(16).padStart(6, '0');
}

export function intToRGB(int: number): {
  r: number,
  g: number,
  b: number,
} {
  return {
    r: (int >> 16) & 0x0ff,
    g: (int >> 8) & 0x0ff,
    b: int & 0x0ff,
  };
}

export function rgbToInt(r: number, g: number, b: number): number {
  return ((r & 0x0ff) << 16) | ((g & 0x0ff) << 8) | (b & 0x0ff);
}

export function toCamelCase(value: string): string {
  if (!value.includes('_')) {
    return value;
  }
  value = value
    .split('_')
    .map((v) => v.charAt(0).toUpperCase() + v.slice(1).toLowerCase())
    .join('');
  return value.charAt(0).toLowerCase() + value.slice(1);
}
