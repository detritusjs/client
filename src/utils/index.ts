import { URLSearchParams } from 'url';

import { Snowflake, Tools } from 'detritus-utils';

const { guildIdtoShardId } = Tools;

import {
  DiscordRegex,
  DiscordRegexNames,
  ImageFormats,
  IMAGE_FORMATS,
} from '../constants';

import * as PermissionTools from './permissions';

export {
  guildIdtoShardId,
  PermissionTools,
  Snowflake,
};
export * from './embed';


export type UrlQuery = {[key: string]: any};

export function addQuery(url: string, query?: UrlQuery): string {
  if (query) {
    const params = new URLSearchParams(query);
    if (url.includes('?')) {
      url += '&' + params.toString();
    } else {
      url += '?' + params.toString();
    }
  }
  return url;
}

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

export function getFormatFromHash(
  hash: string,
  format?: null | string,
  defaultFormat: string = ImageFormats.PNG,
): string {
  if (format) {
    format = format.toLowerCase();
  } else {
    format = defaultFormat;
    if (hash.startsWith('a_')) {
      format = ImageFormats.GIF;
    }
  }
  if (!IMAGE_FORMATS.includes(format)) {
    throw new Error(`Invalid format: '${format}', valid: ${IMAGE_FORMATS}`);
  }
  return format;
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


export interface RegexPayload {
  animated?: boolean,
  id?: string,
  language?: string,
  match: {
    regex: RegExp,
    type: string,
  },
  name?: string,
  text?: string,
}

export function regex(
  type: string,
  content: string,
): null | RegexPayload {
  type = String(type || '').toUpperCase();
  const regex = (<any> DiscordRegex)[type];
  if (regex === undefined) {
    throw new Error(`Unknown regex type: ${type}`);
  }
  const match = regex.exec(content);
  if (!match) {
    return null;
  }

  const payload: RegexPayload = {
    match: {
      regex,
      type,
    },
  };
  switch (type) {
    case DiscordRegexNames.EMOJI: {
      payload.name = <string> match[1];
      payload.id = <string> match[2];
      payload.animated = content.startsWith('<a:');
    }; break;
    case DiscordRegexNames.MENTION_CHANNEL:
    case DiscordRegexNames.MENTION_ROLE:
    case DiscordRegexNames.MENTION_USER: {
      payload.id = <string> match[1];
    }; break;
    case DiscordRegexNames.TEXT_CODEBLOCK: {
      payload.language = <string> match[2];
      payload.text = <string> match[3];
    }; break;
    case DiscordRegexNames.TEXT_BOLD:
    case DiscordRegexNames.TEXT_CODESTRING:
    case DiscordRegexNames.TEXT_ITALICS:
    case DiscordRegexNames.TEXT_SNOWFLAKE:
    case DiscordRegexNames.TEXT_SPOILER:
    case DiscordRegexNames.TEXT_STRIKE:
    case DiscordRegexNames.TEXT_UNDERLINE:
    case DiscordRegexNames.TEXT_URL: {
      payload.text = <string> match[1];
    }; break;
    default: {
      throw new Error(`Unknown regex type: ${type}`);
    };
  }
  return payload;
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
