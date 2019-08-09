import { CommandArgumentTypes } from '../constants';

import {
  Argument,
  ArgumentOptions,
} from './argument';
import { Context } from './context';


/**
 * @category Command
 */
export type ParsedArgs = {[key: string]: any};

/**
 * @category Command
 */
export type ParsedErrors = {[key: string]: Error};

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

  async parse(
    args: Array<string>,
    context: Context,
  ): Promise<{errors: ParsedErrors, parsed: ParsedArgs}> {
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

    const parsing = this.args
      .filter((arg) => arg.isInfinite && arg.in(args))
      .map((arg) => ({arg, index: arg.getPosition(args)}))
      .sort((x, y) => +(x.index < y.index));

    const errors: ParsedErrors = {};
    for (let {arg, index} of parsing) {
      const argValues = args.splice(index);
      argValues.shift();
      try {
        parsed[arg.label] = await arg.parse(argValues.join(' '), context);
      } catch(error) {
        errors[arg.label] = error;
        delete parsed[arg.label];
      }
    }
    return {errors, parsed};
  }
}
