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

    const args = this.args
      .map((arg) => ({arg, info: arg.getInfo(attributes.content)}))
      .filter((x) => x.info.index !== -1)
      .sort((x, y) => +(x.info.index < y.info.index));

    const errors: ParsedErrors = {};
    for (const {arg, info} of args) {
      const value = attributes.content.slice(info.index + info.name.length).trim();
      attributes.content = attributes.content.slice(0, info.index).trim();

      try {
        parsed[arg.label] = await arg.parse(value, context);
      } catch(error) {
        errors[arg.label] = error;
        delete parsed[arg.label];
      }
    }

    return {errors, parsed};
  }
}
