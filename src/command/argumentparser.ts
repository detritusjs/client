import { CommandArgumentTypes } from '../constants';

import {
  Argument,
  ArgumentOptions,
} from './argument';


/**
 * @category Command
 */
export type ParsedArgs = {[key: string]: any};

/**
 * Command Argument
 * @category Command
 */
export class ArgumentParser {
  args: Array<Argument> = [];
  defaults: ParsedArgs = {};

  constructor(args: Array<ArgumentOptions> = []) {
    for (let arg of args) {
      const argument = new Argument(arg);
      this.defaults[argument.label] = argument.default;
      this.args.push(argument);
    }

    Object.defineProperties(this, {
      args: {writable: false},
      defaults: {writable: false},
    });
  }

  parse(args: Array<string>): ParsedArgs {
    const parsed: ParsedArgs = Object.assign({}, this.defaults);

    for (let argument of this.args) {
      if (argument.isInfinite) {
        continue;
      }
      if (!argument.in(args)) {
        continue;
      }
      const index = <number> argument.getPosition(args);
      if (argument.type === CommandArgumentTypes.BOOL) {
        // only remove the argument
        args.splice(index, 1);
        parsed[argument.label] = !argument.default;
      } else {
        parsed[argument.label] = args.splice(index, 2).pop();
      }
    }

    this.args
      .filter((arg) => arg.isInfinite && arg.in(args))
      .map((arg) => ({label: arg.label, index: arg.getPosition(args), type: arg.type}))
      .sort((x, y) => +(x.index < y.index))
      .forEach(({label, index, type}) => {
        const argValues = args.splice(index);
        argValues.shift();

        let value: any = argValues.join(' ');
        switch (type) {
          case CommandArgumentTypes.NUMBER: {
            value = parseInt(value);
          }; break;
        }
        parsed[label] = value;
      });
    return parsed;
  }
}
