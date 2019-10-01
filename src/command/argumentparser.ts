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
export type ParsedArgs = {[key: string]: any} | any;

/**
 * @category Command
 */
export type ParsedErrors = {[key: string]: Error} | any;

/**
 * Command Argument
 * @category Command
 */
export class ArgumentParser {
  args: Array<Argument> = [];

  constructor(args: Array<ArgumentOptions> = []) {
    for (let arg of args) {
      this.args.push(new Argument(arg));
    }
  }

  async parse(
    attributes: CommandAttributes,
    context: Context,
  ): Promise<{errors: ParsedErrors, parsed: ParsedArgs}> {
    const parsed: ParsedArgs = {};

    const insensitive = attributes.content.toLowerCase();
    const args = this.args
      .map((arg) => ({arg, info: arg.getInfo(insensitive)}))
      .filter((x) => x.info.index !== -1)
      .sort((x, y) => y.info.index - x.info.index);

    const errors: ParsedErrors = {};
    for (const {arg, info} of args) {
      const value = attributes.content.slice(info.index + info.name.length);
      if (value && !value.startsWith(' ')) {
        continue;
      }
      attributes.content = attributes.content.slice(0, info.index).trim();

      try {
        parsed[arg.label] = await arg.parse(value.trim(), context);
      } catch(error) {
        errors[arg.label] = error;
      }
    }

    for (let arg of this.args) {
      if (!(arg.label in parsed)) {
        let value: any;
        if (typeof(arg.default) === 'function') {
          try {
            value = await Promise.resolve(arg.default(context));
          } catch(error) {
            errors[arg.label] = error;
            continue;
          }
        } else {
          value = arg.default;
        }

        if (typeof(value) === 'string') {
          try {
            parsed[arg.label] = await arg.parse(value, context);
          } catch(error) {
            errors[arg.label] = error;
          }
        } else {
          parsed[arg.label] = value;
        }
      }
    }

    return {errors, parsed};
  }
}
