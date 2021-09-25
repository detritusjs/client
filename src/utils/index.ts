import * as fs from 'fs';
import { URLSearchParams } from 'url';

import { Snowflake } from 'detritus-utils';
import { guildIdToShardId } from 'detritus-utils/lib/tools';

import {
  DiscordRegex,
  DiscordRegexNames,
  ImageFormats,
  IMAGE_FORMATS,
} from '../constants';


import * as Markup from './markup';
import * as PermissionTools from './permissions';

export {
  guildIdToShardId,
  Markup,
  PermissionTools,
  Snowflake,
};
export * from './components';
export * from './embed';


export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type UrlQuery = Record<string, any>;

export function addQuery(url: string, query?: UrlQuery): string {
  if (query) {
    const params = new URLSearchParams();
    for (let key in query) {
      if (query[key] !== undefined) {
        params.append(key, query[key]);
      }
    }
    const string = params.toString();
    if (string) {
      if (url.includes('?')) {
        url += '&' + string;
      } else {
        url += '?' + string;
      }
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


export async function getFiles(directory: string, subdirectories?: boolean): Promise<Array<string>> {
  if (subdirectories) {
    const dirents: Array<fs.Dirent> = await new Promise((resolve, reject) => {
      fs.readdir(directory, {withFileTypes: true}, (error: Error | null, files: Array<fs.Dirent>) => {
        if (error) {
          reject(error);
        } else {
          resolve(files);
        }
      });
    });

    const names: Array<string> = [];
    for (let folder of dirents.filter((dirent) => dirent.isDirectory())) {
      const files = await getFiles(`${directory}/${folder.name}`, subdirectories);
      for (let name of files) {
        names.push(`${folder.name}/${name}`);
      }
    }
    for (let file of dirents.filter((dirent) => dirent.isFile())) {
      names.push(file.name);
    }
    return names;
  } else {
    const names: Array<string> = await new Promise((resolve, reject) => {
      fs.readdir(directory, (error: Error | null, files: Array<string>) => {
        if (error) {
          reject(error);
        } else {
          resolve(files);
        }
      });
    });
    return names;
  }
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


export function getQueryForImage(query?: number | UrlQuery): undefined | UrlQuery {
  if (typeof(query) === 'number') {
    return {size: query};
  }
  return query;
}


const QuotesAll = {
  '"': '"',
  '\'': '\'',
  '’': '’',
  '‚': '‛',
  '“': '”',
  '„': '‟',
  '「': '」',
  '『': '』',
  '〝': '〞',
  '﹁': '﹂',
  '﹃': '﹄',
  '＂': '＂',
  '｢': '｣',
  '«': '»',
  '《': '》',
  '〈': '〉',
};

const Quotes = {
  END: Object.values(QuotesAll),
  START: Object.keys(QuotesAll),
};

export function getFirstArgument(value: string): [string, string] {
  let result = value.slice(0, 1);
  value = value.slice(1);

  // check to see if this word starts with any of the quote starts
  // if yes, then continue onto the next word
  if (Quotes.START.includes(result)) {
    let index = value.indexOf((QuotesAll as any)[result], 1);
    if (index !== -1) {
      result = value.slice(0, index);
      value = value.slice(index + 1).trim();
      return [result, value];
    }
  }
  // check for the next space, if not then we consume the whole thing
  let index = value.indexOf(' ');
  if (index === -1) {
    result += value.slice(0, value.length);
    value = '';
  } else {
    result += value.slice(0, index);
    value = value.slice(index).trim();
  }
  return [result, value];
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


export interface DiscordRegexMatch {
  animated?: boolean,
  channelId?: string,
  guildId?: string,
  id?: string,
  language?: string,
  matched: string,
  mentionType?: string,
  messageId?: string,
  name?: string,
  text?: string,
}

export interface DiscordRegexPayload {
  match: {
    regex: RegExp,
    type: string,
  },
  matches: Array<DiscordRegexMatch>,
}

export function regex(
  type: string,
  content: string,
  onlyFirst: boolean = false,
): DiscordRegexPayload {
  type = String(type || '').toUpperCase();
  const regex = (DiscordRegex as any)[type];
  if (regex === undefined) {
    throw new Error(`Unknown regex type: ${type}`);
  }
  regex.lastIndex = 0;

  const payload: DiscordRegexPayload = {
    match: {regex, type},
    matches: [],
  };

  let match: RegExpExecArray | null = null;
  while (match = regex.exec(content)) {
    const result: DiscordRegexMatch = {matched: match[0]};
    switch (type) {
      case DiscordRegexNames.EMOJI: {
        result.name = match[1] as string;
        result.id = match[2] as string;
        result.animated = content.startsWith('<a:');
      }; break;
      case DiscordRegexNames.JUMP_CHANNEL: {
        result.guildId = match[1] as string;
        result.channelId = match[2] as string;
      }; break;
      case DiscordRegexNames.JUMP_CHANNEL_MESSAGE: {
        result.guildId = match[1] as string;
        result.channelId = match[2] as string;
        result.messageId = match[3] as string;
      }; break;
      case DiscordRegexNames.MENTION_CHANNEL:
      case DiscordRegexNames.MENTION_ROLE: {
        result.id = match[1] as string;
      }; break;
      case DiscordRegexNames.MENTION_USER: {
        result.id = match[2] as string;
        result.mentionType = match[1] as string;
      }; break;
      case DiscordRegexNames.TEXT_CODEBLOCK: {
        result.language = match[2] as string;
        result.text = match[3] as string;
      }; break;
      case DiscordRegexNames.TEXT_BOLD:
      case DiscordRegexNames.TEXT_CODESTRING:
      case DiscordRegexNames.TEXT_ITALICS:
      case DiscordRegexNames.TEXT_SNOWFLAKE:
      case DiscordRegexNames.TEXT_SPOILER:
      case DiscordRegexNames.TEXT_STRIKE:
      case DiscordRegexNames.TEXT_UNDERLINE:
      case DiscordRegexNames.TEXT_URL: {
        result.text = match[1] as string;
      }; break;
      default: {
        throw new Error(`Unknown regex type: ${type}`);
      };
    }
    payload.matches.push(result);

    if (onlyFirst) {
      break;
    }
  }
  regex.lastIndex = 0;
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
