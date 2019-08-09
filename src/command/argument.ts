import { CommandArgumentTypes } from '../constants';

import { Context } from './context';


export type ArgumentConverter = (value: string, context: Context) => Promise<any> | any;

/**
 * Command Argument Options
 * @category Command Options
 */
export interface ArgumentOptions {
  aliases?: Array<string>,
  default?: any,
  label?: string,
  name: string,
  prefix?: string,
  type?: ArgumentConverter | string,
}

/**
 * Command Argument
 * @category Command
 */
export class Argument {
  aliases: Array<string>;
  default: any;
  label: string;
  name: string;
  prefix?: string = '-';
  type: ArgumentConverter | string = CommandArgumentTypes.STRING;

  constructor(options: ArgumentOptions) {
    if (options.prefix !== undefined) {
      this.prefix = options.prefix;
    }
    this.aliases = (options.aliases || []).map((alias) => {
      return this.prefix + alias.toLowerCase();
    });
    this.default = (options.default === undefined) ? '' : options.default;
    this.label = (options.label || options.name).toLowerCase();
    this.name = this.prefix + options.name.toLowerCase();
    this.type = options.type || this.type;
  }

  check(name: string): boolean {
    return this.name === name || this.aliases.includes(name);
  }

  getName(content: string): null | string {
    if (content.startsWith(this.name)) {
      return this.name;
    }
    for (let alias of this.aliases) {
      if (content.startsWith(alias)) {
        return alias;
      }
    }
    return null;
  }

  getPosition(args: Array<string>): number {
    for (let i = 0; i < args.length; i++) {
      if (this.check(args[i].toLowerCase())) {
        return i;
      }
    }
    return -1;
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
