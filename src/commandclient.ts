import {
  Client as ShardClient,
  ClientOptions,
  ClientRunOptions,
} from './client';
import { ClientEvents, CommandRatelimitTypes } from './constants';
import EventEmitter from './eventemitter';

import { ParsedArgs } from './command/argumentparser';
import {
  Command,
  CommandCallback,
  CommandOptions,
  CommandRatelimitItem,
} from './command/command';
import { Context } from './command/context';

import {
  Message,
  User,
} from './structures';


export interface CommandClientOptions extends ClientOptions {
  activateOnEdits?: boolean,
  ignoreMe?: boolean,
  maxEditDuration?: number,
  mentionsEnabled?: boolean,
  prefix?: string,
  prefixes?: Array<string>,
  prefixSpace?: boolean,
}

export class CommandClient extends EventEmitter {
  readonly _clientListeners: {[key: string]: Function | null} = {};
  activateOnEdits: boolean = false;
  client: ShardClient;
  commands: Array<Command>;
  ignoreMe: boolean = true;
  maxEditDuration: number = 0;
  mentionsEnabled: boolean = true;
  prefixes: {
    custom: Set<string>,
    mention: Set<string>,
  };
  prefixSpace: boolean = false;
  ran: boolean;

  constructor(
    token: ShardClient | string,
    options: CommandClientOptions = {},
  ) {
    super();
    options = Object.assign({}, options);

    let client: ShardClient;
    if (typeof(token) === 'string') {
      client = new ShardClient(token, options);
    } else {
      client = token;
    }

    if (!client || !(client instanceof ShardClient)) {
      throw new Error('Token has to be a string or an instance of a client');
    }
    this.client = client;

    this.activateOnEdits = !!options.activateOnEdits || this.activateOnEdits;
    this.commands = [];
    this.ignoreMe = options.ignoreMe || this.ignoreMe;
    this.maxEditDuration = +(options.maxEditDuration || this.maxEditDuration);
    this.mentionsEnabled = !!options.mentionsEnabled || this.mentionsEnabled;
    this.prefixes = Object.freeze({
      custom: new Set<string>(),
      mention: new Set<string>(),
    });
    this.prefixSpace = !!options.prefixSpace || this.prefixSpace;
    this.ran = this.client.ran;

    if (options.prefix !== undefined) {
      if (options.prefixes === undefined) {
        options.prefixes = [];
      }
      options.prefixes.push(options.prefix);
    }
    if (options.prefixes !== undefined) {
      options.prefixes.sort((x: string, y: string) => +(x.length < y.length));
      for (let prefix of options.prefixes) {
        this.prefixes.custom.add(prefix);
      }
    }

    if (this.ran) {
      this.addMentionPrefixes();
    }

    if (!this.prefixes.custom.size && !this.mentionsEnabled) {
      throw new Error('You must pass in prefixes or enable mentions!');
    }

    Object.defineProperties(this, {
      _clientListeners: {enumerable: false, writable: false},
      activateOnEdits: {configurable: true, writable: false},
      client: {enumerable: false, writable: false},
      commands: {writable: false},
      maxEditDuration: {configurable: true, writable: false},
      mentionsEnabled: {configurable: true, writable: false},
      prefixes: {writable: false},
      prefixSpace: {configurable: true, writable: false},
      ran: {configurable: true, writable: false},
    });
    this._clientListeners[ClientEvents.MESSAGE_CREATE] = null;
    this._clientListeners[ClientEvents.MESSAGE_UPDATE] = null;
  }

  get rest() {
    return this.client.rest;
  }

  /* Set Options */
  setActivateOnEdits(value: boolean): void {
    Object.defineProperty(this, 'activateOnEdits', {value});
  }

  setMaxEditDuration(value: number): void {
    Object.defineProperty(this, 'maxEditDuration', {value});
  }

  setMentionsEnabled(value: boolean): void {
    Object.defineProperty(this, 'mentionsEnabled', {value});
  }

  setPrefixSpace(value: boolean): void {
    Object.defineProperty(this, 'prefixSpace', {value});
  }

  /* Generic Command Function */
  add(
    options: CommandOptions | string,
    run?: CommandCallback,
  ): CommandClient {
    if (typeof(options) === 'string') {
      options = {name: options, run};
    } else {
      if (run !== undefined) {
        options.run = run;
      }
    }

    const command = new Command(this, options);
    if (typeof(options.run) !== 'function') {
      throw new Error('Command needs a run function');
    }
    this.commands.push(command);
    this.setListeners();
    return this;
  }

  addMultiple(commands: Array<CommandOptions> = []) {
    for (let command of commands) {
      this.add(command);
    }
  }

  addMentionPrefixes(): void {
    let user: User;
    if (this.client.user !== null) {
      user = <User> this.client.user;
    } else {
      return;
    }
    this.prefixes.mention.add(user.mention);
    this.prefixes.mention.add(`<@!${user.id}>`);
  }

  clear(): void {
    this.commands.length = 0;
    this.resetListeners();
  }

  getAttributes(
    args: Array<string>,
  ): CommandAttributes | null {
    if (!args.length) {
      return null;
    }
    let prefix: string = '';
    if (this.prefixSpace) {
      const first = (<string> args.shift()).toLowerCase();
      if (this.prefixes.custom.has(first)) {
        prefix = first;
      } else {
        if (this.mentionsEnabled && this.prefixes.mention.has(first)) {
          prefix = first;
        }
      }
    } else {
      const first = args[0].toLowerCase();
      for (let customPrefix of this.prefixes.custom) {
        if (first.startsWith(customPrefix)) {
          prefix = first.substring(0, customPrefix.length);
          break;
        }
      }
      if (prefix) {
        args[0] = args[0].substring(prefix.length);
      } else {
        if (this.mentionsEnabled && this.prefixes.mention.has(first)) {
          args.shift();
          prefix = first;
        }
      }
    }
    if (prefix) {
      return <CommandAttributes> {args, prefix};
    }
    return null;
  }

  getCommand(
    args: Array<string>,
  ): Command | null {
    const name = (args.shift() || '').toLowerCase();
    if (name) {
      return this.commands.find((command) => command.check(name)) || null;
    }
    return null;
  }

  resetListeners(): void {
    for (let name in this._clientListeners) {
      const listener = this._clientListeners[name];
      if (listener !== null) {
        this.client.removeListener(name, listener);
        this._clientListeners[name] = null;
      }
    }
  }

  setListeners(): void {
    for (let name in this._clientListeners) {
      if (this._clientListeners[name] === null) {
        const listener = this.handle.bind(this, name);
        this.client.on(name, listener);
        this._clientListeners[name] = listener;
      }
    }
  }

  /* Kill/Run */
  kill(): void {
    this.client.kill();
    this.emit('killed');
    this.clearListeners();
  }

  async run(
    options: ClientRunOptions = {},
  ): Promise<ShardClient> {
    if (this.ran) {
      return this.client;
    }
    const client = await this.client.run(options);
    Object.defineProperty(this, 'ran', {value: true});
    this.addMentionPrefixes();
    return client;
  }

  /* Handler */
  async handle(
    name: string,
    {differences, message}: any,
  ): Promise<void> {
    if (this.ignoreMe && message.fromMe) {
      return;
    }
    if (name === ClientEvents.MESSAGE_UPDATE) {
      if (!this.activateOnEdits || differences.content === undefined) {
        return;
      }
    }
    const context = new Context(message, this);
    if (!message.fromUser) {
      const error = new Error('Message is not from a user.');
      this.emit(ClientEvents.COMMAND_NONE, {context, error});
      return;
    }
    if (message.isEdited) {
      const difference = (<number> message.editedTimestampUnix) - message.timestampUnix;
      if (this.maxEditDuration < difference) {
        const error = new Error('Edit timestamp is higher than max edit duration');
        this.emit(ClientEvents.COMMAND_NONE, {context, error});
        return;
      }
    }

    const attributes = this.getAttributes(message.content.split(' '));
    if (attributes === null) {
      const error = new Error('Does not start with any allowed prefixes');
      this.emit(ClientEvents.COMMAND_NONE, {context, error});
      return;
    }

    const command = this.getCommand(attributes.args);
    if (command === null) {
      const error = new Error('Unknown Command');
      this.emit(ClientEvents.COMMAND_NONE, {context, error});
      return;
    }

    if (!command.responseOptional && !message.canReply) {
      const error = new Error('Cannot send messages in this channel');
      this.emit(ClientEvents.COMMAND_ERROR, {command, context, error});
      return;
    }

    if (command.ratelimit !== null) {
      let cacheId: string;
      switch (command.ratelimit.type) {
        case CommandRatelimitTypes.CHANNEL: {
          cacheId = message.channelId;
        }; break;
        case CommandRatelimitTypes.GUILD: {
          cacheId = message.guildId || message.channelId;
        }; break;
        default: {
          cacheId = message.author.id;
        };
      }
      const ratelimit = <CommandRatelimitItem> command.getRatelimit(cacheId);
      if (command.ratelimit.limit < ratelimit.usages + 1) {
        const remaining = (ratelimit.start + command.ratelimit.duration) - Date.now();
        this.emit(ClientEvents.COMMAND_RATELIMIT, {command, context, remaining});
        try {
          const onRatelimit = (typeof(command.onRatelimit) === 'function') ? command.onRatelimit(context, remaining) : null;
          await Promise.resolve(onRatelimit);
        } catch(error) {
          // do something with this?
        }
        return;
      }
    }

    if (command.disableDm && context.inDm) {
      const error = new Error('Command with DMs disabled used in DM');
      if (command.disableDmReply) {
        this.emit(ClientEvents.COMMAND_ERROR, {command, context, error});
      } else {
        try {
          const reply = await message.reply(`Cannot use \`${command.name}\` in DMs.`);
          this.emit(ClientEvents.COMMAND_ERROR, {command, context, error, reply});
        } catch(e) {
          const extra = e;
          this.emit(ClientEvents.COMMAND_ERROR, {command, context, error, extra});
        }
      }
      return;
    }

    const args = command.getArgs(attributes.args);
    const prefix = attributes.prefix;
    try {
      const onBefore = (typeof(command.onBefore) === 'function') ? command.onBefore(context, args) : true;
      const shouldRun = await Promise.resolve(onBefore);
      if (!shouldRun) {
        if (typeof(command.onCancel) === 'function') {
          await Promise.resolve(command.onCancel(context, args));
        }
        return;
      }

      const run = (typeof(command.run) === 'function') ? command.run(context, args) : null;
      try {
        await Promise.resolve(run);
        this.emit(ClientEvents.COMMAND_RUN, {args, command, context, prefix});
        const onSuccess = (typeof(command.onSuccess) === 'function') ? command.onSuccess(context, args) : null;
        await Promise.resolve(onSuccess);
      } catch(error) {
        this.emit(ClientEvents.COMMAND_FAIL, {args, command, context, error, prefix});
        const onError = (typeof(command.onError) === 'function') ? command.onError(context, args, error) : null;
        await Promise.resolve(onError);
      }
    } catch(error) {
      if (typeof(command.onError) === 'function') {
        await Promise.resolve(command.onError(context, args, error));
      }
      this.emit(ClientEvents.COMMAND_FAIL, {args, command, context, error, prefix});
    }
  }
}


export interface CommandAttributes {
  args: Array<string>;
  prefix: string;
}

export interface CommandPayloadArgs {
  [command: string]: string,
}

export interface CommandPayload {
  args?: ParsedArgs,
  command?: Command;
  content: Context;
  error?: Error;
  extra?: any;
  prefix?: string;
  remaining?: number;
  reply?: Message;
}
