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
import {
  InteractionCommand,
  InteractionCommandOption,
  InteractionCommandOptionChoice,
} from '../interaction';
import {
  ApplicationCommand,
  ApplicationCommandOption,
  ApplicationCommandOptionChoice,
} from '../structures/applicationcommand';


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
export * from './modal';


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


// generate a waveform for discord from a mono channel Float32Array
export function generateWaveform(samples: Float32Array, sampleRate: number = 48000): string {
  // Calculate number of points (1 points per 100ms, limited to 256 datapoints)
  const numPoints = Math.min(Math.floor(samples.length / (sampleRate / 10)), 256);
  const samplesPerPoint = Math.floor(samples.length / numPoints);

  const waveformPoints = new Uint8Array(numPoints);
  for (let i = 0; i < numPoints; i++) {
    const startIndex = Math.floor(i * samples.length / numPoints);
    const endIndex = Math.floor((i + 1) * samples.length / numPoints);

    // Find peak amplitude in this segment
    let maxAmplitude = 0;
    for (let j = startIndex; j < endIndex; j++) {
      const amplitude = Math.abs(samples[j]);
      if (maxAmplitude < amplitude) {
        maxAmplitude = amplitude;
      }
    }

    // Scale to 0-255
    waveformPoints[i] = Math.min(255, Math.floor(maxAmplitude * 255));
  }
  return Buffer.from(waveformPoints).toString('base64');
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


export interface DiscordRegexPayloadEmoji {
  match: {regex: RegExp, type: DiscordRegexNames.EMOJI},
  matches: Array<{animated: boolean, matched: string, name: string, id: string}>,
}

export interface DiscordRegexPayloadJumpChannel {
  match: {regex: RegExp, type: DiscordRegexNames.JUMP_CHANNEL},
  matches: Array<{channelId: string, guildId: string, matched: string}>,
}

export interface DiscordRegexPayloadJumpChannelMessage {
  match: {regex: RegExp, type: DiscordRegexNames.JUMP_CHANNEL_MESSAGE},
  matches: Array<{channelId: string, guildId: string, matched: string, messageId: string}>,
}

export interface DiscordRegexPayloadMentionChannelOrRole {
  match: {regex: RegExp, type: DiscordRegexNames.MENTION_CHANNEL | DiscordRegexNames.MENTION_ROLE},
  matches: Array<{id: string, matched: string}>,
}

export interface DiscordRegexPayloadMentionUser {
  match: {regex: RegExp, type: DiscordRegexNames.MENTION_USER},
  matches: Array<{id: string, matched: string, mentionType: string}>,
}

export interface DiscordRegexPayloadTextCodeblock {
  match: {regex: RegExp, type: DiscordRegexNames.TEXT_CODEBLOCK},
  matches: Array<{language: string, matched: string, text: string}>,
}

export interface DiscordRegexPayloadTextGeneric {
  match: {regex: RegExp, type: (
    DiscordRegexNames.TEXT_BOLD | DiscordRegexNames.TEXT_CODESTRING |
    DiscordRegexNames.TEXT_ITALICS | DiscordRegexNames.TEXT_SNOWFLAKE |
    DiscordRegexNames.TEXT_SPOILER | DiscordRegexNames.TEXT_STRIKE |
    DiscordRegexNames.TEXT_UNDERLINE | DiscordRegexNames.TEXT_URL
  )},
  matches: Array<{matched: string, text: string}>,
}

export interface DiscordRegexPayloadTimestamp {
  match: {regex: RegExp, type: DiscordRegexNames.TIMESTAMP},
  matches: Array<{format?: string, matched: string, timestamp: string}>,
}

export type DiscordRegexPayload = (
  DiscordRegexPayloadEmoji | DiscordRegexPayloadJumpChannel | DiscordRegexPayloadJumpChannelMessage |
  DiscordRegexPayloadMentionChannelOrRole | DiscordRegexPayloadMentionUser | DiscordRegexPayloadTextCodeblock |
  DiscordRegexPayloadTextGeneric | DiscordRegexPayloadTimestamp
);


export function regex(
  regexName: string,
  content: string,
  onlyFirst: boolean = false,
): DiscordRegexPayload {
  const type = String(regexName || '').toUpperCase() as DiscordRegexNames;
  const regex = DiscordRegex[type];
  if (regex === undefined) {
    throw new Error(`Unknown regex type: ${type}`);
  }
  regex.lastIndex = 0;

  const payload: any = {
    match: {regex, type},
    matches: [],
  };

  let match: RegExpExecArray | null = null;
  while (match = regex.exec(content)) {
    const result: any = {matched: match[0]};
    switch (type) {
      case DiscordRegexNames.EMOJI: {
        result.animated = !!match[1];
        result.name = match[2]!;
        result.id = match[3]!;
      }; break;
      case DiscordRegexNames.JUMP_CHANNEL: {
        result.guildId = match[1]!;
        result.channelId = match[2]!;
      }; break;
      case DiscordRegexNames.JUMP_CHANNEL_MESSAGE: {
        result.guildId = match[1]!;
        result.channelId = match[2]!;
        result.messageId = match[3]!;
      }; break;
      case DiscordRegexNames.MENTION_CHANNEL:
      case DiscordRegexNames.MENTION_ROLE: {
        result.id = match[1]!;
      }; break;
      case DiscordRegexNames.MENTION_USER: {
        result.id = match[2]!;
        result.mentionType = match[1]!;
      }; break;
      case DiscordRegexNames.TEXT_CODEBLOCK: {
        result.language = match[2]!;
        result.text = match[3]!;
      }; break;
      case DiscordRegexNames.TEXT_BOLD:
      case DiscordRegexNames.TEXT_CODESTRING:
      case DiscordRegexNames.TEXT_ITALICS:
      case DiscordRegexNames.TEXT_SNOWFLAKE:
      case DiscordRegexNames.TEXT_SPOILER:
      case DiscordRegexNames.TEXT_STRIKE:
      case DiscordRegexNames.TEXT_UNDERLINE:
      case DiscordRegexNames.TEXT_URL: {
        result.text = (match[1] || match[2])!;
      }; break;
      case DiscordRegexNames.TIMESTAMP: {
        result.timestamp = match[1]!;
        result.format = match[2] || undefined;
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



export const KeyGenerator = Object.freeze({
  ApplicationCommand: (command: ApplicationCommand | InteractionCommand): string => {
    return [
      command.name,
      command.description,
      command.type,
      (command.options) ? command.options.map((x) => x.key).join(':') : '',
      JSON.stringify(command.descriptionLocalizations),
      JSON.stringify(command.nameLocalizations),
      command.defaultMemberPermissions,
      (command.dmPermission === undefined) ? true : !command.dmPermission,
      command.contexts || null,
      (command.integrationTypes) ? command.integrationTypes.sort() : null,
      Boolean(command.nsfw),
    ].join('-');
  },
  ApplicationCommandOption: (option: ApplicationCommandOption | InteractionCommandOption): string => {
    return [
      option.name,
      option.description,
      option.type,
      !!option.required,
      !!option.autocomplete,
      (option.options) ? option.options.map((x) => x.key).join(':') : '',
      (option.choices) ? option.choices.map((x) => x.key).join(':') : '',
      JSON.stringify(option.descriptionLocalizations),
      JSON.stringify(option.nameLocalizations),
      JSON.stringify(option.channelTypes),
      option.maxValue,
      option.minValue,
    ].join('-');
  },
  ApplicationCommandOptionChoice: (choice: ApplicationCommandOptionChoice | InteractionCommandOptionChoice): string => {
    return `${choice.name}-${choice.value}-${typeof(choice.value)}-${JSON.stringify(choice.nameLocalizations)}`;
  },
});
