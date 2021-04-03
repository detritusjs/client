import { Timers } from 'detritus-utils';

import { BaseCollection } from '../collections/basecollection';
import { Command } from './command';
import { Context } from './context';
import { 
  CommandRatelimitTypes,
  COMMAND_RATELIMIT_TYPES,
} from '../constants';



export type CommandRatelimitCustomType = (context: Context) => string;

/**
 * Command Ratelimit Options
 * @category Command Options
 */
export interface CommandRatelimitOptions {
  duration?: number,
  limit?: number,
  type?: CommandRatelimitTypes | string | CommandRatelimitCustomType,
}

/**
 * Command Ratelimit Item
 * @category Command
 */
export interface CommandRatelimitItem {
  key: string,
  replied: boolean,
  start: number,
  timeout: Timers.Timeout,
  usages: number,
}

/**
 * Command Ratelimit Options and Cache
 * @category Command
 */
export class CommandRatelimit {
  command?: Command;
  duration: number = 5000;
  limit: number = 5;
  type: CommandRatelimitTypes | CommandRatelimitCustomType = CommandRatelimitTypes.USER;

  constructor(options: boolean | CommandRatelimitOptions = {}, command?: Command) {
    options = Object.assign({}, options) as CommandRatelimitOptions;

    this.command = command || this.command;
    this.duration = options.duration || this.duration;
    this.limit = options.limit || this.limit;

    if (options.type) {
      if (typeof(options.type) === 'string') {
        this.type = options.type.toLowerCase() as CommandRatelimitTypes;
      } else {
        this.type = options.type;
      }
    }

    if (typeof(this.type) === 'string' && !COMMAND_RATELIMIT_TYPES.includes(this.type)) {
      // maybe error instead?
      this.type = CommandRatelimitTypes.USER;
    }
  }

  createKey(context: Context): string {
    let key: string;
    if (typeof(this.type) === 'function') {
      key = this.type(context);
    } else {
      switch (this.type) {
        case CommandRatelimitTypes.CHANNEL: {
          key = context.channelId;
        }; break;
        case CommandRatelimitTypes.GUILD: {
          key = context.guildId || context.channelId;
        }; break;
        default: {
          key = context.userId;
        };
      }
      if (this.command) {
        key = `${key}:${this.command.names[0]}`;
      }
    }
    return key;
  }
}


export class CommandRatelimiter {
  readonly cache = new BaseCollection<string, CommandRatelimitItem>();

  getExceeded(
    context: Context,
    ratelimits: Array<CommandRatelimit>,
    now: number = Date.now(),
  ): Array<{item: CommandRatelimitItem, ratelimit: CommandRatelimit, remaining: number}> {
    const exceeded: Array<{
      item: CommandRatelimitItem,
      ratelimit: CommandRatelimit,
      remaining: number,
    }> = [];
    for (const ratelimit of ratelimits) {
      const item = this.getOrCreate(context, ratelimit);
      if (ratelimit.limit <= item.usages++) {
        const remaining = (item.start + ratelimit.duration) - now;
        exceeded.push({item, ratelimit, remaining});
      }
    }
    return exceeded;
  }

  getOrCreate(context: Context, ratelimit: CommandRatelimit): CommandRatelimitItem {
    const key = ratelimit.createKey(context);

    let item: CommandRatelimitItem;
    if (this.cache.has(key)) {
      item = this.cache.get(key) as CommandRatelimitItem;
    } else {
      const timeout = new Timers.Timeout();
      timeout.start(ratelimit.duration, () => {
        this.cache.delete(key);
      });

      item = {
        key,
        replied: false,
        start: Date.now(),
        timeout,
        usages: 0,
      };
      this.cache.set(key, item);
    }
    return item;
  }
}
