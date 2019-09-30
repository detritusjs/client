import { URLSearchParams } from 'url';

import { Snowflake, Tools } from 'detritus-utils';

const { guildIdToShardId } = Tools;

import {
  CommandRatelimit,
  CommandRatelimitItem,
} from '../command/ratelimit';
import {
  CommandRatelimitTypes,
  DiscordRegex,
  DiscordRegexNames,
  ImageFormats,
  IMAGE_FORMATS,
} from '../constants';
import { Message } from '../structures/message';


import * as Markup from './markup';
import * as PermissionTools from './permissions';

export {
  guildIdToShardId,
  Markup,
  PermissionTools,
  Snowflake,
};
export * from './embed';


export type UrlQuery = {[key: string]: any};

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

export function getExceededRatelimits(
  ratelimits: Array<CommandRatelimit>,
  message: Message,
  now: number = Date.now(),
): Array<{item: CommandRatelimitItem, ratelimit: CommandRatelimit, remaining: number}> {
  const exceeded: Array<{
    item: CommandRatelimitItem,
    ratelimit: CommandRatelimit,
    remaining: number,
  }> = [];
  for (const ratelimit of ratelimits) {
    let cacheId: string;
    switch (ratelimit.type) {
      case CommandRatelimitTypes.CHANNEL: {
        cacheId = message.channelId;
      }; break;
      case CommandRatelimitTypes.GUILD: {
        cacheId = message.guildId || message.channelId;
      }; break;
      default: {
        cacheId = message.author.id;
      };
    }

    const item = <CommandRatelimitItem> ratelimit.get(cacheId);
    if (ratelimit.limit <= item.usages++) {
      const remaining = (item.start + ratelimit.duration) - now;
      exceeded.push({item, ratelimit, remaining});
    }
  }
  return exceeded;
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


export interface DiscordRegexMatch {
  animated?: boolean,
  id?: string,
  language?: string,
  matched: string,
  mentionType?: string,
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
  const regex = (<any> DiscordRegex)[type];
  if (regex === undefined) {
    throw new Error(`Unknown regex type: ${type}`);
  }

  const payload: DiscordRegexPayload = {
    match: {regex, type},
    matches: [],
  };

  let match: RegExpExecArray | null = null;
  while (match = regex.exec(content)) {
    const result: DiscordRegexMatch = {matched: match[0]};
    switch (type) {
      case DiscordRegexNames.EMOJI: {
        result.name = <string> match[1];
        result.id = <string> match[2];
        result.animated = content.startsWith('<a:');
      }; break;
      case DiscordRegexNames.MENTION_CHANNEL:
      case DiscordRegexNames.MENTION_ROLE: {
        result.id = <string> match[1];
      }; break;
      case DiscordRegexNames.MENTION_USER: {
        result.id = <string> match[2];
        result.mentionType = <string> match[1];
      }; break;
      case DiscordRegexNames.TEXT_CODEBLOCK: {
        result.language = <string> match[2];
        result.text = <string> match[3];
      }; break;
      case DiscordRegexNames.TEXT_BOLD:
      case DiscordRegexNames.TEXT_CODESTRING:
      case DiscordRegexNames.TEXT_ITALICS:
      case DiscordRegexNames.TEXT_SNOWFLAKE:
      case DiscordRegexNames.TEXT_SPOILER:
      case DiscordRegexNames.TEXT_STRIKE:
      case DiscordRegexNames.TEXT_UNDERLINE:
      case DiscordRegexNames.TEXT_URL: {
        result.text = <string> match[1];
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
