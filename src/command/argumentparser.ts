import { CommandAttributes } from '../commandclient';
import { getFirstArgument } from '../utils';

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
  readonly args: Array<Argument> = [];

  positional: boolean = false;

  constructor(args: Array<ArgumentOptions> = [], positional?: boolean) {
    this.positional = !!positional;
    this.initialize(args);
  }

  initialize(args: Array<ArgumentOptions> = []) {
    this.args.length = 0;
    for (let arg of args) {
      this.args.push(new Argument(arg));
    }
  }

  async parse(
    attributes: CommandAttributes,
    context: Context,
  ): Promise<{errors: ParsedErrors, parsed: ParsedArgs}> {
    const errors: ParsedErrors = {};
    const parsed: ParsedArgs = {};
    if (this.args.length) {
      if (this.positional) {
        for (const arg of this.args) {
          try {
            let value: string;
            let content: string;
            if (arg.consume) {
              value = attributes.content;
              content = '';
            } else {
              if (attributes.content) {
                // get first value from attributes.content;
                [ value, content ] = getFirstArgument(attributes.content);
              } else {
                continue;
              }
            }
            const parsedValue = await arg.parse(value.trim(), context);
            if (Array.isArray(parsedValue) && parsedValue.length === 2 && parsedValue[0] === true) {
              // check if it's [boolean, any] (specifically [true, any]) for skipping the value
              parsed[arg.label] = parsedValue[1];
            } else {
              parsed[arg.label] = parsedValue;
              attributes.content = content;
            }
          } catch(error) {
            errors[arg.label] = error;
          }
        }
      } else {
        const insensitive = attributes.content.toLowerCase();
        const args = this.args
          .map((arg) => ({arg, info: arg.getInfo(insensitive)}))
          .filter((x) => x.info.index !== -1)
          .sort((x, y) => y.info.index - x.info.index);
        for (const {arg, info} of args) {
          const value = attributes.content.slice(info.index + info.name.length);
          // incase something like `.command -argSOMEVALUE` happens, we the arg
          if (value && !value.startsWith(' ')) {
            continue;
          }
          attributes.content = attributes.content.slice(0, info.index).trim();
          try {
            if (arg.positionalArgs) {
              const positional = await arg.positionalArgs.parse({content: value, prefix: ''}, context);
              Object.assign(parsed, positional.parsed);
              Object.assign(errors, positional.errors);
            } else {
              parsed[arg.label] = await arg.parse(value.trim(), context);
            }
          } catch(error) {
            errors[arg.label] = error;
          }
        }
      }

      for (let arg of this.args) {
        if (!(arg.label in parsed) && !(arg.label in errors)) {
          try {
            if (arg.default !== undefined) {
              let value: any;
              if (typeof(arg.default) === 'function') {
                value = await Promise.resolve(arg.default(context));
              } else {
                value = arg.default;
              }
  
              if (typeof(value) === 'string') {
                value = await arg.parse(value, context);
              }
              parsed[arg.label] = value;
            } else if (arg.required) {
              throw new Error(arg.help || 'Missing required parameter');
            }
            // or else ignore the arg
          } catch(error) {
            errors[arg.label] = error;
          }
        }
      }
    }

    return {errors, parsed};
  }
}
