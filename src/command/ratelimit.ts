import { Timers } from 'detritus-utils';

import { BaseCollection } from '../collections/basecollection';
import { 
  CommandRatelimitTypes,
  COMMAND_RATELIMIT_TYPES,
} from '../constants';


/**
 * Command Ratelimit Options
 * @category Command Options
 */
export interface CommandRatelimitOptions {
  duration?: number,
  limit?: number,
  type?: string,
}

/**
 * Command Ratelimit Item
 * @category Command
 */
export interface CommandRatelimitItem {
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
  readonly cache = new BaseCollection<string, CommandRatelimitItem>();

  duration: number = 5000;
  limit: number = 5;
  type: string = CommandRatelimitTypes.USER;

  constructor(options: boolean | CommandRatelimitOptions = {}) {
    options = <CommandRatelimitOptions> Object.assign({}, options);

    this.duration = options.duration || this.duration;
    this.limit = options.limit || this.limit;
    this.type = (options.type || this.type).toLowerCase();
    if (!COMMAND_RATELIMIT_TYPES.includes(this.type)) {
      this.type = CommandRatelimitTypes.USER;
    }

    Object.defineProperties(this, {
      cache: {enumerable: false, writable: false},
      command: {enumerable: false, writable: false},
    });
  }

  get(cacheId: string): CommandRatelimitItem {
    let ratelimit: CommandRatelimitItem;
    if (this.cache.has(cacheId)) {
      ratelimit = <CommandRatelimitItem> this.cache.get(cacheId);
    } else {
      const timeout = new Timers.Timeout();
      timeout.start(this.duration, () => {
        this.cache.delete(cacheId);
      });

      ratelimit = {
        replied: false,
        start: Date.now(),
        timeout,
        usages: 0,
      };
      this.cache.set(cacheId, ratelimit);
    }
    return ratelimit;
  }
}
