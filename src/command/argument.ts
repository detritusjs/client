import {
  CommandArgumentTypes,
} from '../constants';


export interface ArgumentOptions {
  aliases?: Array<string>,
  default?: any,
  label?: string,
  name: string,
  type?: string,
}

export class Argument {
  aliases: Array<string>;
  default: any;
  label: string;
  name: string;
  type: string = CommandArgumentTypes.STRING;

  constructor(options: ArgumentOptions) {
    this.aliases = (options.aliases || []).map((alias) => `-${alias.toLowerCase()}`);
    this.default = (options.default === undefined) ? '' : options.default;
    this.label = (options.label || options.name).toLowerCase();
    this.name = `-${options.name.toLowerCase()}`;
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
}
