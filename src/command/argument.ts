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

  get isInfinite(): boolean {
    return this.type !== CommandArgumentTypes.BOOL;
  }

  check(name: string): boolean {
    return this.name === name || this.aliases.includes(name);
  }

  in(args: Array<string>): boolean {
    return args.some((arg) => this.check(arg));
  }

  getPosition(args: Array<string>): number {
    for (let i = 0; i < args.length; i++) {
      if (this.check(args[i])) {
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
          parsedValue = !!value;
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
