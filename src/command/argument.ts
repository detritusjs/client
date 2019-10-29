import { CommandArgumentTypes } from '../constants';

import { Context } from './context';


export type ArgumentConverter = (value: string, context: Context) => Promise<any> | any;

export type ArgumentDefault = ((context: Context) => Promise<any> | any) | any;

/**
 * Command Argument Options
 * @category Command Options
 */
export interface ArgumentOptions {
  aliases?: Array<string>,
  default?: ArgumentDefault,
  label?: string,
  metadata?: {[key: string]: any},
  name: string,
  prefix?: string,
  prefixes?: Array<string>,
  prefixSpace?: boolean,
  type?: ArgumentConverter | Boolean | Number | String | string,
}


const blankPrefixes = Object.freeze(['']);

/**
 * Command Argument
 * @category Command
 */
export class Argument {
  aliases: Array<string>;
  default: ArgumentDefault = undefined;
  label: string;
  metadata?: {[key: string]: any};
  name: string;
  prefixes: Set<string> = new Set(['-']);
  type: ArgumentConverter | string = CommandArgumentTypes.STRING;

  constructor(options: ArgumentOptions) {
    options = Object.assign({}, options);

    if (options.metadata !== undefined) {
      this.metadata = Object.assign({}, options.metadata);
    }
    if (options.prefix !== undefined) {
      if (options.prefixes === undefined) {
        options.prefixes = [];
      }
      options.prefixes.push(options.prefix);
    }
    if (options.prefixes !== undefined) {
      options.prefixes.sort((x: string, y: string) => y.length - x.length);
      if (options.prefixes.some((prefix) => prefix.endsWith(' '))) {
        options.prefixSpace = true;
      }

      this.prefixes.clear();
      for (let prefix of options.prefixes) {
        if (!prefix) {
          continue;
        }

        prefix = prefix.trim();
        if (options.prefixSpace) {
          prefix += ' ';
        }
        if (prefix) {
          this.prefixes.add(prefix);
        }
      }
    }

    this.aliases = (options.aliases || []).map((alias) => alias.toLowerCase());
    this.default = options.default;
    this.label = (options.label || options.name).toLowerCase();
    this.name = options.name.toLowerCase();

    switch (options.type) {
      case Boolean: {
        options.type = CommandArgumentTypes.BOOL;
      }; break;
      case Number: {
        options.type = CommandArgumentTypes.NUMBER;
      }; break;
      case String: {
        options.type = CommandArgumentTypes.STRING;
      }; break;
    }

    this.type = <ArgumentConverter | string> (options.type || this.type);

    switch (this.type) {
      case CommandArgumentTypes.BOOL: {
        this.default = !!this.default;
      }; break;
    }
  }

  get names(): Array<string> {
    const names: Array<string> = [];
    const prefixes = (this.prefixes.size) ? this.prefixes : blankPrefixes;
    for (let prefix of prefixes) {
      names.push((prefix) ? prefix + this.name : this.name);
      for (let alias of this.aliases) {
        names.push((prefix) ? prefix + alias : alias);
      }
    }
    return names;
  }

  check(name: string): boolean {
    return this.names.some((n) => n === name);
  }

  getInfo(content: string): {index: number, name: string} {
    const info = {index: -1, name: ''};

    for (let name of this.names) {
      const index = content.indexOf(name);
      if (index !== -1) {
        info.index = index;
        info.name = name;
        break;
      }
    }

    return info;
  }

  getName(content: string): null | string {
    for (let name of this.names) {
      if (name.includes(' ')) {
        const parts = name.split(' ');
        let matches = true;

        let copy = content;
        let store: string = '';
        for (let [key, part] of parts.entries()) {
          if (copy.length === part.length) {
            if (copy === part) {
              store += copy;
              copy = '';
              continue;
            }
          } else {
            if (copy.startsWith(part + ' ')) {
              store += part;
              copy = copy.slice(part.length);
              if (key !== (parts.length - 1)) {
                while (copy.startsWith(' ')) {
                  store += ' ';
                  copy = copy.slice(1);
                }
              }
              continue;
            }
          }
          matches = false;
          break;
        }
        if (matches) {
          return store;
        }
      } else {
        if (content.length === name.length) {
          if (content === name) {
            return name;
          }
        } else {
          if (content.startsWith(name + ' ')) {
            return name;
          }
        }
      }
    }
    return null;
  }

  async parse(value: string, context: Context): Promise<any> {
    let parsedValue: any = value || this.default;
    if (typeof(this.type) === 'function') {
      parsedValue = await Promise.resolve(this.type(value, context));
    } else {
      switch (this.type) {
        case CommandArgumentTypes.BOOL: {
          parsedValue = !this.default;
        }; break;
        case CommandArgumentTypes.FLOAT: {
          parsedValue = parseFloat(value);
        }; break;
        case CommandArgumentTypes.NUMBER: {
          parsedValue = parseInt(value);
        }; break;
      }
    }
    return parsedValue;
  }
}
