import * as path from 'path';

import { EventSpewer } from 'detritus-utils';

import { ShardClient } from './client';
import {
  ClusterClient,
  ClusterClientOptions,
  ClusterClientRunOptions,
} from './clusterclient';
import { ClientEvents } from './constants';
import { ImportedCommandsError } from './errors';
import { getExceededRatelimits, getFiles } from './utils';

import {
  Command,
  CommandCallbackRun,
  CommandOptions,
} from './command/command';
import { Context } from './command/context';
import { CommandEvents } from './command/events';
import {
  CommandRatelimit,
  CommandRatelimitOptions,
} from './command/ratelimit';

import { BaseCollection } from './collections';
import { Message, Typing, User } from './structures';


export interface CommandClientOptions extends ClusterClientOptions {
  activateOnEdits?: boolean,
  ignoreMe?: boolean,
  maxEditDuration?: number,
  mentionsEnabled?: boolean,
  onPrefixCheck?: CommandClientPrefixCheck,
  prefix?: string,
  prefixes?: Array<string>,
  prefixSpace?: boolean,
  ratelimit?: CommandRatelimitOptions,
  ratelimits?: Array<CommandRatelimitOptions>,
  useClusterClient?: boolean,
}

export type CommandClientPrefixes = Array<string> | Set<string> | string;
export type CommandClientPrefixCheck = (context: Context) => CommandClientPrefixes | Promise<CommandClientPrefixes>;

export interface CommandClientAdd extends CommandOptions {
  _class?: any,
}

export interface CommandClientRunOptions extends ClusterClientRunOptions {

}

export interface CommandAttributes {
  content: string,
  prefix: string,
}


/**
 * Command Client, hooks onto the ShardClient to provide easier command handling
 * @category Clients
 */
export class CommandClient extends EventSpewer {
  readonly _clientListeners: {[key: string]: null | ((...args: any[]) => void)} = {};

  activateOnEdits: boolean = false;
  client: ClusterClient | ShardClient;
  commands: Array<Command>;
  ignoreMe: boolean = true;
  maxEditDuration: number = 5 * 60 * 1000;
  mentionsEnabled: boolean = true;
  prefixes: {
    custom: Set<string>,
    mention: Set<string>,
  };
  ran: boolean;
  ratelimits: Array<CommandRatelimit> = [];
  replies: BaseCollection<string, Message>;

  onPrefixCheck?: CommandClientPrefixCheck;

  constructor(
    token: ShardClient | string,
    options: CommandClientOptions = {},
  ) {
    super();
    options = Object.assign({}, options);

    if (process.env.CLUSTER_MANAGER === 'true') {
      token = <string> process.env.CLUSTER_TOKEN;
      options.useClusterClient = true;
    }

    let client: ClusterClient | ShardClient;
    if (typeof(token) === 'string') {
      if (options.useClusterClient) {
        client = new ClusterClient(token, options);
      } else {
        client = new ShardClient(token, options);
      }
    } else {
      client = token;
    }

    if (!client || !(client instanceof ClusterClient || client instanceof ShardClient)) {
      throw new Error('Token has to be a string or an instance of a client');
    }
    this.client = client;
    Object.defineProperty(this.client, 'commandClient', {value: this});

    this.activateOnEdits = !!options.activateOnEdits || this.activateOnEdits;
    this.commands = [];
    this.ignoreMe = options.ignoreMe || this.ignoreMe;
    this.maxEditDuration = +(options.maxEditDuration || this.maxEditDuration);
    this.mentionsEnabled = !!(options.mentionsEnabled || options.mentionsEnabled === undefined);
    this.onPrefixCheck = options.onPrefixCheck;
    this.prefixes = Object.freeze({
      custom: new Set<string>(),
      mention: new Set<string>(),
    });
    this.ran = this.client.ran;
    this.replies = new BaseCollection({expire: this.maxEditDuration});

    if (options.prefix !== undefined) {
      if (options.prefixes === undefined) {
        options.prefixes = [];
      }
      options.prefixes.push(options.prefix);
    }
    if (options.prefixes !== undefined) {
      options.prefixes.sort((x: string, y: string) => +(x.length < y.length));
      for (let prefix of options.prefixes) {
        prefix = prefix.trim();
        if (options.prefixSpace) {
          prefix += ' ';
        }
        this.prefixes.custom.add(prefix);
      }
    }

    if (this.ran) {
      this.addMentionPrefixes();
    }

    if (options.ratelimit) {
      this.ratelimits.push(new CommandRatelimit(options.ratelimit));
    }
    if (options.ratelimits) {
      for (let rOptions of options.ratelimits) {
        const rType = (rOptions.type || '').toLowerCase();
        if (this.ratelimits.some((ratelimit) => ratelimit.type === rType)) {
          throw new Error(`Ratelimit with type ${rType} already exists`);
        }
        this.ratelimits.push(new CommandRatelimit(rOptions));
      }
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
      onPrefixCheck: {enumerable: false},
      prefixes: {writable: false},
      prefixSpace: {configurable: true, writable: false},
      ran: {configurable: true, writable: false},
      replies: {enumerable: false, writable: false},
    });
    this._clientListeners[ClientEvents.MESSAGE_CREATE] = null;
    this._clientListeners[ClientEvents.MESSAGE_DELETE] = null;
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
    options: Command | CommandClientAdd | string,
    run?: CommandCallbackRun,
  ): CommandClient {
    let command: Command;
    if (options instanceof Command) {
      command = options;
    } else {
      if (typeof(options) === 'string') {
        options = {name: options, run};
      } else {
        if (run !== undefined) {
          options.run = run;
        }
      }
      if (options._class === undefined) {
        command = new Command(this, options);
      } else {
        command = new options._class(this, options);
      }
    }

    if (typeof(command.run) !== 'function') {
      throw new Error('Command needs a run function');
    }

    for (let name of command.names) {
      if (this.commands.some((c) => c.check(name))) {
        throw new Error(`Alias/name \`${name}\` already exists.`);
      }
    }

    this.commands.push(command);
    this.commands.sort((x, y) => y.priority - x.priority);
    this.setListeners();
    return this;
  }

  addMultiple(commands: Array<CommandOptions> = []): CommandClient {
    for (let command of commands) {
      this.add(command);
    }
    return this;
  }

  async addMultipleIn(directory: string, options: {isAbsolute?: boolean, subdirectories?: boolean} = {}): Promise<CommandClient> {
    options = Object.assign({}, options);
    if (!options.isAbsolute) {
      if (require.main) {
        // require.main.path exists but typescript doesn't let us use it..
        directory = path.join(path.dirname(require.main.filename), directory);
      }
    }

    const files: Array<string> = await getFiles(directory, options.subdirectories);
    const errors: {[key: string]: Error} = {};
    for (let file of files) {
      if (!file.endsWith('.js')) {
        continue;
      }
      const filepath = path.resolve(directory, file);

      try {
        let importedCommand: any = require(filepath);
        if (typeof(importedCommand) === 'function') {
          this.add({_file: filepath, _class: importedCommand, name: ''});
        } else if (importedCommand instanceof Command) {
          Object.defineProperty(importedCommand, '_file', {value: filepath});
          this.add(importedCommand);
        } else if (typeof(importedCommand) === 'object') {
          if ('default' in importedCommand) {
            importedCommand = importedCommand.default;
          }
          this.add({...importedCommand, _file: filepath});
        }
      } catch(error) {
        errors[filepath] = error;
      }
    }

    if (Object.keys(errors).length) {
      throw new ImportedCommandsError(errors);
    }

    return this;
  }

  addMentionPrefixes(): void {
    let user: null | User = null;
    if (this.client instanceof ClusterClient) {
      for (let [shardId, shard] of this.client.shards) {
        if (shard.user != null) {
          user = <User> shard.user;
          break;
        }
      }
    } else if (this.client instanceof ShardClient) {
      if (this.client.user != null) {
        user = <User> this.client.user;
      }
    }
    if (user !== null) {
      this.prefixes.mention.add(user.mention);
      this.prefixes.mention.add(`<@!${user.id}>`);
    }
  }

  clear(): void {
    for (let command of this.commands) {
      if (command._file) {
        const requirePath = require.resolve(command._file);
        if (requirePath) {
          delete require.cache[requirePath];
        }
      }
    }
    this.commands.length = 0;
    this.resetListeners();
  }

  async getAttributes(context: Context): Promise<CommandAttributes | null> {
    let content = context.message.content.trim();
    let contentLower = content.toLowerCase();
    if (!content) {
      return null;
    }

    let prefix: string = '';
    if (this.mentionsEnabled) {
      for (let mention of this.prefixes.mention) {
        if (contentLower.startsWith(mention)) {
          prefix = mention;
          break;
        }
      }
    }
    if (!prefix) {
      const customPrefixes = await Promise.resolve(this.getPrefixes(context));
      for (let custom of customPrefixes) {
        if (contentLower.startsWith(custom)) {
          prefix = custom;
          break;
        }
      }
    }
    if (prefix) {
      content = content.substring(prefix.length).trim();
      return {content, prefix};
    }
    return null;
  }

  getCommand(attributes: CommandAttributes): Command | null {
    if (attributes.content) {
      const insensitive = attributes.content.toLowerCase();
      for (let command of this.commands) {
        const name = command.getName(insensitive);
        if (name) {
          attributes.content = attributes.content.substring(name.length).trim();
          return command;
        }
      }
    }
    return null;
  }

  async getPrefixes(context: Context): Promise<Set<string>> {
    if (typeof(this.onPrefixCheck) === 'function') {
      const prefixes = await Promise.resolve(this.onPrefixCheck(context));
      if (prefixes instanceof Set) {
        return prefixes;
      }
      if (Array.isArray(prefixes)) {
        return new Set(prefixes);
      }
      if (typeof(prefixes) === 'string') {
        return new Set([prefixes]);
      }
      throw new Error('Invalid Prefixes Type Received');
    }
    return this.prefixes.custom;
  }

  resetListeners(): void {
    for (let name in this._clientListeners) {
      const listener = this._clientListeners[name];
      if (listener) {
        this.client.removeListener(name, listener);
        this._clientListeners[name] = null;
      }
    }
  }

  setListeners(): void {
    this.resetListeners();
    this._clientListeners[ClientEvents.MESSAGE_CREATE] = this.handle.bind(this, ClientEvents.MESSAGE_CREATE);
    this._clientListeners[ClientEvents.MESSAGE_DELETE] = this.handleDelete.bind(this, ClientEvents.MESSAGE_DELETE);
    this._clientListeners[ClientEvents.MESSAGE_UPDATE] = this.handle.bind(this, ClientEvents.MESSAGE_UPDATE);
    for (let name in this._clientListeners) {
      const listener = this._clientListeners[name];
      if (listener) {
        this.client.addListener(name, listener);
      }
    }
  }

  /* Kill/Run */
  kill(): void {
    this.client.kill();
    this.emit(ClientEvents.KILLED);
    this.removeAllListeners();
  }

  async run(
    options: CommandClientRunOptions = {},
  ): Promise<ClusterClient | ShardClient> {
    if (this.ran) {
      return this.client;
    }
    await this.client.run(options);
    Object.defineProperty(this, 'ran', {value: true});
    this.addMentionPrefixes();
    return this.client;
  }

  /* Handler */
  async handle(
    name: string,
    event: {
      differences: any | null | undefined,
      message: Message | null,
      typing: Typing | null | undefined,
    },
  ): Promise<void> {
    const { differences, message, typing } = event;
    if (!message || (this.ignoreMe && message.fromMe)) {
      return;
    }
    if (name === ClientEvents.MESSAGE_UPDATE) {
      if (!this.activateOnEdits) {
        return;
      }
      if (!differences || !differences.content) {
        return;
      }
    }

    const context = new Context(message, typing || null, this);

    let attributes: CommandAttributes | null = null;
    try {
      if (!message.fromUser) {
        throw new Error('Message is not from a user.');
      }

      if (message.isEdited) {
        const difference = (<number> message.editedAtUnix) - message.timestampUnix;
        if (this.maxEditDuration < difference) {
          throw new Error('Edit timestamp is higher than max edit duration');
        }
      }

      attributes = await this.getAttributes(context);
      if (!attributes) {
        throw new Error('Does not start with any allowed prefixes');
      }
    } catch(error) {
      this.emit(ClientEvents.COMMAND_NONE, {context, error});
      return;
    }

    const command = this.getCommand(attributes);
    if (command) {
      context.command = command;
    } else {
      const error = new Error('Unknown Command');
      this.emit(ClientEvents.COMMAND_NONE, {context, error});
      return;
    }

    if (!command.responseOptional && !message.canReply) {
      const error = new Error('Cannot send messages in this channel');
      this.emit(ClientEvents.COMMAND_ERROR, {command, context, error});
      return;
    }

    if (this.ratelimits.length || command.ratelimits.length) {
      const now = Date.now();
      {
        const ratelimits = getExceededRatelimits(this.ratelimits, message, now);
        if (ratelimits.length) {
          const global = true;

          const payload: CommandEvents.CommandRatelimit = {command, context, global, ratelimits, now};
          this.emit(ClientEvents.COMMAND_RATELIMIT, payload);

          if (typeof(command.onRatelimit) === 'function') {
            try {
              await Promise.resolve(command.onRatelimit(context, ratelimits, {global, now}));
            } catch(error) {
              // do something with this error?
            }
          }
          return;
        }
      }

      {
        const ratelimits = getExceededRatelimits(command.ratelimits, message, now);
        if (ratelimits.length) {
          const global = false;

          const payload: CommandEvents.CommandRatelimit = {command, context, global, ratelimits, now};
          this.emit(ClientEvents.COMMAND_RATELIMIT, payload);

          if (typeof(command.onRatelimit) === 'function') {
            try {
              await Promise.resolve(command.onRatelimit(context, ratelimits, {global, now}));
            } catch(error) {
              // do something with this error?
            }
          }
          return;
        }
      }
    }

    if (command.disableDm && context.inDm) {
      const error = new Error('Command with DMs disabled used in DM');
      if (command.disableDmReply) {
        this.emit(ClientEvents.COMMAND_ERROR, {command, context, error});
      } else {
        try {
          const reply = await message.reply(`Cannot use \`${command.name}\` in DMs.`);
          if (this.maxEditDuration) {
            this.replies.set(message.id, reply);
          }
          this.emit(ClientEvents.COMMAND_ERROR, {command, context, error, reply});
        } catch(e) {
          this.emit(ClientEvents.COMMAND_ERROR, {command, context, error, extra: e});
        }
      }
      return;
    }

    if (typeof(command.onBefore) === 'function') {
      try {
        const shouldContinue = await Promise.resolve(command.onBefore(context));
        if (!shouldContinue) {
          if (typeof(command.onCancel) === 'function') {
            const reply = await Promise.resolve(command.onCancel(context));
            if (this.maxEditDuration && reply instanceof Message) {
              this.replies.set(message.id, reply);
            }
          }
          return;
        }
      } catch(error) {
        this.emit(ClientEvents.COMMAND_ERROR, {command, context, error});
        return;
      }
    }

    const prefix = context.prefix = attributes.prefix;
    const {errors, parsed: args} = await command.getArgs(attributes, context);
    if (Object.keys(errors).length) {
      if (typeof(command.onTypeError) === 'function') {
        const reply = await Promise.resolve(command.onTypeError(context, args, errors));
        if (this.maxEditDuration && reply instanceof Message) {
          this.replies.set(message.id, reply);
        }
      }
      const error = new Error('Command errored out while converting args');
      this.emit(ClientEvents.COMMAND_ERROR, {command, context, error, extra: errors});
      return;
    }

    try {
      if (typeof(command.onBeforeRun) === 'function') {
        const shouldRun = await Promise.resolve(command.onBeforeRun(context, args));
        if (!shouldRun) {
          if (typeof(command.onCancelRun) === 'function') {
            const reply = await Promise.resolve(command.onCancelRun(context, args));
            if (this.maxEditDuration && reply instanceof Message) {
              this.replies.set(message.id, reply);
            }
          }
          return;
        }
      }

      try {
        if (typeof(command.run) === 'function') {
          const reply = await Promise.resolve(command.run(context, args));
          if (this.maxEditDuration && reply instanceof Message) {
            this.replies.set(message.id, reply);
          }
        }
        this.emit(ClientEvents.COMMAND_RAN, {args, command, context, prefix});
        if (typeof(command.onSuccess) === 'function') {
          await Promise.resolve(command.onSuccess(context, args));
        }
      } catch(error) {
        this.emit(ClientEvents.COMMAND_RUN_ERROR, {args, command, context, error, prefix});
        if (typeof(command.onRunError) === 'function') {
          await Promise.resolve(command.onRunError(context, args, error));
        }
      }
    } catch(error) {
      if (typeof(command.onError) === 'function') {
        await Promise.resolve(command.onError(context, args, error));
      }
      this.emit(ClientEvents.COMMAND_FAIL, {args, command, context, error, prefix});
    }
  }

  async handleDelete(name: string, payload: {raw: {id: string}}): Promise<void> {
    this.replies.delete(payload.raw.id);
  }

  on(event: string | symbol, listener: (...args: any[]) => void): this;
  on(event: 'commandError', listener: (payload: CommandEvents.CommandError) => any): this;
  on(event: 'commandFail', listener: (payload: CommandEvents.CommandFail) => any): this;
  on(event: 'commandNone', listener: (payload: CommandEvents.CommandNone) => any): this;
  on(event: 'commandRan', listener: (payload: CommandEvents.CommandRan) => any): this;
  on(event: 'commandRatelimit', listener: (payload: CommandEvents.CommandRatelimit) => any): this;
  on(event: 'commandRunError', listener: (payload: CommandEvents.CommandRunError) => any): this;
  on(event: 'killed', listener: () => any): this;
  on(event: string | symbol, listener: (...args: any[]) => void): this {
    super.on(event, listener);
    return this;
  }
}
