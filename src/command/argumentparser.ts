import { CommandAttributes } from '../commandclient';
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
    attributes: CommandAttributes,
    context: Context,
  ): Promise<{errors: ParsedErrors, parsed: ParsedArgs}> {
    const parsed: ParsedArgs = Object.assign({}, this.defaults);
    const args = attributes.content.split(' ');

    const parsing = this.args
      .map((arg) => ({arg, index: arg.getPosition(args)}))
      .filter((x) => x.index !== -1)
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
    attributes.content = args.join(' ');
    return {errors, parsed};
  }
}
