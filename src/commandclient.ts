import * as path from 'path';

import { EventSpewer, EventSubscription, Timers } from 'detritus-utils';

import { ShardClient } from './client';
import {
  ClusterClient,
  ClusterClientOptions,
  ClusterClientRunOptions,
} from './clusterclient';
import { ClientEvents, Permissions, IS_TS_NODE } from './constants';
import { ImportedCommandsError } from './errors';
import { GatewayClientEvents } from './gateway/clientevents';
import { PermissionTools, getExceededRatelimits, getFiles } from './utils';

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

import { BaseCollection, BaseSet } from './collections';
import { Message, Typing, User } from './structures';


export interface CommandClientOptions extends ClusterClientOptions {
  activateOnEdits?: boolean,
  ignoreMe?: boolean,
  maxEditDuration?: number,
  mentionsEnabled?: boolean,
  onCommandCheck?: CommandClientCommandCheck,
  onMessageCheck?: CommandClientMessageCheck,
  onPrefixCheck?: CommandClientPrefixCheck,
  prefix?: string,
  prefixes?: Array<string>,
  prefixSpace?: boolean,
  ratelimit?: CommandRatelimitOptions,
  ratelimits?: Array<CommandRatelimitOptions>,
  useClusterClient?: boolean,
}

export type CommandClientCommandCheck = (context: Context, command: Command) => boolean | Promise<boolean>;
export type CommandClientMessageCheck = (context: Context) => boolean | Promise<boolean>;

export type CommandClientPrefixes = Array<string> | BaseSet<string> | Set<string> | string;
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

export interface CommandReply {
  command: Command,
  context: Context,
  reply: Message,
}


/**
 * Command Client, hooks onto the ShardClient to provide easier command handling
 * Flow is `onMessageCheck` -> `onPrefixCheck` -> `onCommandCheck`
 * @category Clients
 */
export class CommandClient extends EventSpewer {
  readonly _clientSubscriptions: Array<EventSubscription> = [];

  activateOnEdits: boolean = false;
  client: ClusterClient | ShardClient;
  commands: Array<Command>;
  ignoreMe: boolean = true;
  maxEditDuration: number = 5 * 60 * 1000;
  mentionsEnabled: boolean = true;
  prefixes: {
    custom: BaseSet<string>,
    mention: BaseSet<string>,
  };
  ran: boolean;
  ratelimits: Array<CommandRatelimit> = [];
  replies: BaseCollection<string, CommandReply>;

  onCommandCheck?(context: Context, command: Command): boolean | Promise<boolean>;
  onMessageCheck?(context: Context): boolean | Promise<boolean>;
  onPrefixCheck?(context: Context): CommandClientPrefixes | Promise<CommandClientPrefixes>;

  constructor(
    token: ShardClient | string,
    options: CommandClientOptions = {},
  ) {
    super();
    options = Object.assign({useClusterClient: true}, options);

    if (process.env.CLUSTER_MANAGER === 'true') {
      token = process.env.CLUSTER_TOKEN as string;
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
    this.prefixes = Object.freeze({
      custom: new BaseSet<string>(),
      mention: new BaseSet<string>(),
    });
    this.ran = this.client.ran;
    this.replies = new BaseCollection({expire: this.maxEditDuration});

    this.onCommandCheck = options.onCommandCheck || this.onCommandCheck;
    this.onMessageCheck = options.onMessageCheck || this.onMessageCheck;
    this.onPrefixCheck = options.onPrefixCheck || this.onPrefixCheck;

    if (options.prefix !== undefined) {
      if (options.prefixes === undefined) {
        options.prefixes = [];
      }
      options.prefixes.push(options.prefix);
    }

    if (options.prefixes !== undefined) {
      options.prefixes.sort((x: string, y: string) => y.length - x.length);
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
      _clientSubscriptions: {enumerable: false, writable: false},
      activateOnEdits: {configurable: true, writable: false},
      client: {enumerable: false, writable: false},
      commands: {writable: false},
      maxEditDuration: {configurable: true, writable: false},
      mentionsEnabled: {configurable: true, writable: false},
      onCommandCheck: {enumerable: false, writable: true},
      onPrefixCheck: {enumerable: false, writable: true},
      prefixes: {writable: false},
      prefixSpace: {configurable: true, writable: false},
      ran: {configurable: true, writable: false},
      replies: {enumerable: false, writable: false},
    });
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
      // create a normal command class with the options given
      if (options._class === undefined) {
        command = new Command(this, options);
      } else {
        // check for `.constructor` to make sure it's a class
        if (options._class.constructor) {
          command = new options._class(this, options);
        } else {
          // else it's just a function, `ts-node` outputs these
          command = options._class(this, options);
        }
        if (!command._file) {
          Object.defineProperty(command, '_file', {value: options._file});
        }
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
    this.setSubscriptions();
    return this;
  }

  addMultiple(commands: Array<CommandOptions> = []): CommandClient {
    for (let command of commands) {
      this.add(command);
    }
    return this;
  }

  async addMultipleIn(
    directory: string,
    options: {isAbsolute?: boolean, subdirectories?: boolean} = {},
  ): Promise<CommandClient> {
    options = Object.assign({}, options);
    if (!options.isAbsolute) {
      if (require.main) {
        // require.main.path exists but typescript doesn't let us use it..
        directory = path.join(path.dirname(require.main.filename), directory);
      }
    }

    const files: Array<string> = await getFiles(directory, options.subdirectories);
    const errors: {[key: string]: Error} = {};

    const addCommand = (imported: any, filepath: string): void => {
      if (!imported) {
        return;
      }
      if (typeof(imported) === 'function') {
        this.add({_file: filepath, _class: imported, name: ''});
      } else if (imported instanceof Command) {
        Object.defineProperty(imported, '_file', {value: filepath});
        this.add(imported);
      } else if (typeof(imported) === 'object' && Object.keys(imported).length) {
        if (Array.isArray(imported)) {
          for (let child of imported) {
            addCommand(child, filepath);
          }
        } else {
          if ('name' in imported) {
            this.add({...imported, _file: filepath});
          }
        }
      }
    };
    for (let file of files) {
      if (!file.endsWith((IS_TS_NODE) ? '.ts' : '.js')) {
        continue;
      }
      const filepath = path.resolve(directory, file);
      try {
        let importedCommand: any = require(filepath);
        if (typeof(importedCommand) === 'object' && importedCommand.__esModule) {
          importedCommand = importedCommand.default;
        }
        addCommand(importedCommand, filepath);
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
    let userId: string | null = null;
    if (this.client instanceof ClusterClient) {
      for (let [shardId, shard] of this.client.shards) {
        if (shard.user) {
          userId = shard.user.id;
          break;
        }
      }
    } else if (this.client instanceof ShardClient) {
      if (this.client.user) {
        userId = this.client.user.id;
      }
    }
    if (userId) {
      this.prefixes.mention.clear();
      this.prefixes.mention.add(`<@${userId}>`);
      this.prefixes.mention.add(`<@!${userId}>`);
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
    this.resetSubscriptions();
  }

  async getAttributes(context: Context): Promise<CommandAttributes | null> {
    let content = context.message.content.trim();
    let contentLower = content.toLowerCase();
    if (!content) {
      return null;
    }

    let prefix: string = '';
    if (this.mentionsEnabled) {
      if (!this.prefixes.mention.length) {
        this.addMentionPrefixes();
      }
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

  async getPrefixes(context: Context): Promise<BaseSet<string>> {
    if (typeof(this.onPrefixCheck) === 'function') {
      const prefixes = await Promise.resolve(this.onPrefixCheck(context));
      if (prefixes === this.prefixes.custom) {
        return prefixes as BaseSet<string>;
      }

      let sorted: Array<string>;
      if (prefixes instanceof Set || prefixes instanceof BaseSet) {
        sorted = Array.from(prefixes);
      } else if (typeof(prefixes) === 'string') {
        sorted = [prefixes];
      } else if (Array.isArray(prefixes)) {
        sorted = prefixes;
      } else {
        throw new Error('Invalid Prefixes Type Received');
      }
      return new BaseSet(sorted.sort((x, y) => y.length - x.length));
    }
    return this.prefixes.custom;
  }

  resetSubscriptions(): void {
    while (this._clientSubscriptions.length) {
      const subscription = this._clientSubscriptions.shift();
      if (subscription) {
        subscription.remove();
      }
    }
  }

  setSubscriptions(): void {
    this.resetSubscriptions();

    const subscriptions = this._clientSubscriptions;
    subscriptions.push(this.client.subscribe(ClientEvents.MESSAGE_CREATE, this.handleMessageCreate.bind(this)));
    subscriptions.push(this.client.subscribe(ClientEvents.MESSAGE_DELETE, this.handleDelete.bind(this, ClientEvents.MESSAGE_DELETE)));
    subscriptions.push(this.client.subscribe(ClientEvents.MESSAGE_UPDATE, this.handleMessageUpdate.bind(this)));
  }

  /* Kill/Run */
  kill(): void {
    this.client.kill();
    this.emit(ClientEvents.KILLED);
    this.resetSubscriptions();
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

  storeReply(messageId: string, command: Command, context: Context, reply: Message): void {
    if (this.maxEditDuration && reply instanceof Message) {
      this.replies.set(messageId, {command, context, reply});
    }
  }

  /* Handler */
  async handleMessageCreate(event: GatewayClientEvents.MessageCreate) {
    return this.handle(ClientEvents.MESSAGE_CREATE, event);
  }

  async handleMessageUpdate(event: GatewayClientEvents.MessageUpdate) {
    if (event.isEmbedUpdate) {
      return;
    }
    return this.handle(ClientEvents.MESSAGE_UPDATE, event);
  }

  async handle(name: ClientEvents.MESSAGE_CREATE, event: GatewayClientEvents.MessageCreate): Promise<void>
  async handle(name: ClientEvents.MESSAGE_UPDATE, event: GatewayClientEvents.MessageUpdate): Promise<void>
  async handle(
    name: ClientEvents.MESSAGE_CREATE | ClientEvents.MESSAGE_UPDATE,
    event: GatewayClientEvents.MessageCreate | GatewayClientEvents.MessageUpdate,
  ): Promise<void> {
    const { message } = event;
    // message will only be null on embed updates
    if (!message || (this.ignoreMe && message.fromMe)) {
      return;
    }
    let typing: Typing | null = null;
    if (name === ClientEvents.MESSAGE_CREATE) {
      ({typing} = event as GatewayClientEvents.MessageCreate);
    }

    const context = new Context(message, typing, this);
    if (typeof(this.onMessageCheck) === 'function') {
      try {
        const shouldContinue = await Promise.resolve(this.onMessageCheck(context));
        if (!shouldContinue) {
          const error = new Error('Message check returned false');
          const payload: CommandEvents.CommandNone = {context, error};
          this.emit(ClientEvents.COMMAND_NONE, payload);
          return;
        }
      } catch(error) {
        const payload: CommandEvents.CommandNone = {context, error};
        this.emit(ClientEvents.COMMAND_ERROR, payload);
        return;
      }
    }

    if (name === ClientEvents.MESSAGE_UPDATE) {
      if (!this.activateOnEdits) {
        return;
      }
      const { differences } = event as GatewayClientEvents.MessageUpdate;
      if (!differences || !differences.content) {
        return;
      }
    }

    let attributes: CommandAttributes | null = null;
    try {
      if (!message.fromUser) {
        throw new Error('Message is not from a user.');
      }

      if (message.isEdited) {
        const difference = message.editedAtUnix - message.timestampUnix;
        if (this.maxEditDuration < difference) {
          throw new Error('Edit timestamp is higher than max edit duration');
        }
      }

      attributes = await this.getAttributes(context);
      if (!attributes) {
        throw new Error('Does not start with any allowed prefixes');
      }
    } catch(error) {
      const payload: CommandEvents.CommandNone = {context, error};
      this.emit(ClientEvents.COMMAND_NONE, payload);
      return;
    }

    const command = this.getCommand(attributes);
    if (command) {
      context.command = command;
      if (typeof(this.onCommandCheck) === 'function') {
        try {
          const shouldContinue = await Promise.resolve(this.onCommandCheck(context, command));
          if (!shouldContinue) {
            const error = new Error('Command check returned false');
            const payload: CommandEvents.CommandNone = {context, error};
            this.emit(ClientEvents.COMMAND_NONE, payload);
            return;
          }
        } catch(error) {
          const payload: CommandEvents.CommandNone = {context, error};
          this.emit(ClientEvents.COMMAND_ERROR, payload);
          return;
        }
      }
    } else {
      const error = new Error('Unknown Command');
      const payload: CommandEvents.CommandNone = {context, error};
      this.emit(ClientEvents.COMMAND_NONE, payload);
      return;
    }

    if (!command.responseOptional && !message.canReply) {
      const error = new Error('Cannot send messages in this channel');

      const payload: CommandEvents.CommandError = {command, context, error};
      this.emit(ClientEvents.COMMAND_ERROR, payload);
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

    if (context.inDm) {
      if (command.disableDm) {
        const error = new Error('Command with DMs disabled used in DM');
        if (command.disableDmReply) {
          const payload: CommandEvents.CommandError = {command, context, error};
          this.emit(ClientEvents.COMMAND_ERROR, payload);
        } else {
          try {
            const reply = await message.reply(`Cannot use \`${command.name}\` in DMs.`);
            this.storeReply(message.id, command, context, reply);
            const payload: CommandEvents.CommandError = {command, context, error, reply};
            this.emit(ClientEvents.COMMAND_ERROR, payload);
          } catch(e) {
            const payload: CommandEvents.CommandError = {command, context, error, extra: e};
            this.emit(ClientEvents.COMMAND_ERROR, payload);
          }
        }
        return;
      }
    } else {
      // check the bot's permissions in the server
      // should never be ignored since it's most likely the bot will rely on this permission to do whatever action
      if (Array.isArray(command.permissionsClient) && command.permissionsClient.length) {
        const failed = [];

        const channel = context.channel;
        const member = context.me;
        if (channel && member) {
          const total = member.permissionsIn(channel);
          if (!member.isOwner && !PermissionTools.checkPermissions(total, Permissions.ADMINISTRATOR)) {
            for (let permission of command.permissionsClient) {
              if (!PermissionTools.checkPermissions(total, permission)) {
                failed.push(permission);
              }
            }
          }
        } else {
          for (let permission of command.permissionsClient) {
            failed.push(permission);
          }
        }

        if (failed.length) {
          const payload: CommandEvents.CommandPermissionsFailClient = {command, context, permissions: failed};
          this.emit(ClientEvents.COMMAND_PERMISSIONS_FAIL_CLIENT, payload);
          if (typeof(command.onPermissionsFailClient) === 'function') {
            try {
              await Promise.resolve(command.onPermissionsFailClient(context, failed));
            } catch(error) {
              // do something with this error?
            }
          }
          return;
        }
      }

      // if command doesn't specify it should ignore the client owner, or if the user isn't a client owner
      // continue to permission checking
      if (!command.permissionsIgnoreClientOwner || !context.user.isClientOwner) {
        // check the user's permissions
        if (Array.isArray(command.permissions) && command.permissions.length) {
          const failed = [];

          const channel = context.channel;
          const member = context.member;
          if (channel && member) {
            const total = member.permissionsIn(channel);
            if (!member.isOwner && !PermissionTools.checkPermissions(total, Permissions.ADMINISTRATOR)) {
              for (let permission of command.permissions) {
                if (!PermissionTools.checkPermissions(total, permission)) {
                  failed.push(permission);
                }
              }
            }
          } else {
            for (let permission of command.permissions) {
              failed.push(permission);
            }
          }

          if (failed.length) {
            const payload: CommandEvents.CommandPermissionsFail = {command, context, permissions: failed};
            this.emit(ClientEvents.COMMAND_PERMISSIONS_FAIL, payload);
            if (typeof(command.onPermissionsFail) === 'function') {
              try {
                await Promise.resolve(command.onPermissionsFail(context, failed));
              } catch(error) {
                // do something with this error?
              }
            }
            return;
          }
        }
      }
    }

    if (typeof(command.onBefore) === 'function') {
      try {
        const shouldContinue = await Promise.resolve(command.onBefore(context));
        if (!shouldContinue) {
          if (typeof(command.onCancel) === 'function') {
            const reply = await Promise.resolve(command.onCancel(context));
            this.storeReply(message.id, command, context, reply);
          }
          return;
        }
      } catch(error) {
        const payload: CommandEvents.CommandError = {command, context, error};
        this.emit(ClientEvents.COMMAND_ERROR, payload);
        return;
      }
    }

    const prefix = context.prefix = attributes.prefix;
    const {errors, parsed: args} = await command.getArgs(attributes, context);
    if (Object.keys(errors).length) {
      if (typeof(command.onTypeError) === 'function') {
        const reply = await Promise.resolve(command.onTypeError(context, args, errors));
        this.storeReply(message.id, command, context, reply);
      }
      const error = new Error('Command errored out while converting args');
      const payload: CommandEvents.CommandError = {command, context, error, extra: errors};
      this.emit(ClientEvents.COMMAND_ERROR, payload);
      return;
    }

    try {
      if (typeof(command.onBeforeRun) === 'function') {
        const shouldRun = await Promise.resolve(command.onBeforeRun(context, args));
        if (!shouldRun) {
          if (typeof(command.onCancelRun) === 'function') {
            const reply = await Promise.resolve(command.onCancelRun(context, args));
            this.storeReply(message.id, command, context, reply);
          }
          return;
        }
      }

      let timeout: Timers.Timeout | null = null;
      try {
        if (command.triggerTypingAfter !== -1) {
          if (command.triggerTypingAfter) {
            timeout = new Timers.Timeout();
            timeout.start(command.triggerTypingAfter, async () => {
              try {
                await context.triggerTyping();
              } catch(error) {
                // do something maybe?
              }
            });
          } else {
            await context.triggerTyping();
          }
        }

        if (typeof(command.run) === 'function') {
          const reply = await Promise.resolve(command.run(context, args));
          this.storeReply(message.id, command, context, reply);
        }

        if (timeout) {
          timeout.stop();
        }

        const payload: CommandEvents.CommandRan = {args, command, context, prefix};
        this.emit(ClientEvents.COMMAND_RAN, payload);
        if (typeof(command.onSuccess) === 'function') {
          await Promise.resolve(command.onSuccess(context, args));
        }
      } catch(error) {
        if (timeout) {
          timeout.stop();
        }

        const payload: CommandEvents.CommandRunError = {args, command, context, error, prefix};
        this.emit(ClientEvents.COMMAND_RUN_ERROR, payload);
        if (typeof(command.onRunError) === 'function') {
          await Promise.resolve(command.onRunError(context, args, error));
        }
      }
    } catch(error) {
      if (typeof(command.onError) === 'function') {
        await Promise.resolve(command.onError(context, args, error));
      }
      const payload: CommandEvents.CommandFail = {args, command, context, error, prefix};
      this.emit(ClientEvents.COMMAND_FAIL, payload);
    }
  }

  async handleDelete(name: string, deletePayload: {raw: {id: string}}): Promise<void> {
    const messageId = deletePayload.raw.id;
    if (this.replies.has(messageId)) {
      const { command, context, reply } = this.replies.get(messageId) as CommandReply;
      this.replies.delete(messageId);

      const payload: CommandEvents.CommandDelete = {command, context, reply};
      this.emit(ClientEvents.COMMAND_DELETE, payload);
    } else {
      for (let [commandId, { command, context, reply }] of this.replies) {
        if (reply.id === messageId) {
          this.replies.delete(commandId);

          const payload: CommandEvents.CommandResponseDelete = { command, context, reply };
          this.emit(ClientEvents.COMMAND_RESPONSE_DELETE, payload);
        }
      }
    }
  }

  on(event: string | symbol, listener: (...args: any[]) => void): this;
  on(event: ClientEvents.COMMAND_DELETE, listener: (payload: CommandEvents.CommandDelete) => any): this;
  on(event: 'commandDelete', listener: (payload: CommandEvents.CommandDelete) => any): this;
  on(event: ClientEvents.COMMAND_ERROR, listener: (payload: CommandEvents.CommandError) => any): this;
  on(event: 'commandError', listener: (payload: CommandEvents.CommandError) => any): this;
  on(event: ClientEvents.COMMAND_FAIL, listener: (payload: CommandEvents.CommandFail) => any): this;
  on(event: 'commandFail', listener: (payload: CommandEvents.CommandFail) => any): this;
  on(event: ClientEvents.COMMAND_NONE, listener: (payload: CommandEvents.CommandNone) => any): this;
  on(event: 'commandNone', listener: (payload: CommandEvents.CommandNone) => any): this;
  on(event: ClientEvents.COMMAND_PERMISSIONS_FAIL_CLIENT, listener: (payload: CommandEvents.CommandPermissionsFailClient) => any): this;
  on(event: 'commandPermissionsFailClient', listener: (payload: CommandEvents.CommandPermissionsFailClient) => any): this;
  on(event: ClientEvents.COMMAND_PERMISSIONS_FAIL, listener: (payload: CommandEvents.CommandPermissionsFail) => any): this;
  on(event: 'commandPermissionsFail', listener: (payload: CommandEvents.CommandPermissionsFail) => any): this;
  on(event: ClientEvents.COMMAND_RAN, listener: (payload: CommandEvents.CommandRan) => any): this;
  on(event: 'commandRan', listener: (payload: CommandEvents.CommandRan) => any): this;
  on(event: ClientEvents.COMMAND_RATELIMIT, listener: (payload: CommandEvents.CommandRatelimit) => any): this;
  on(event: 'commandRatelimit', listener: (payload: CommandEvents.CommandRatelimit) => any): this;
  on(event: ClientEvents.COMMAND_RESPONSE_DELETE, listener: (payload: CommandEvents.CommandResponseDelete) => any): this;
  on(event: 'commandResponseDelete', listener: (payload: CommandEvents.CommandResponseDelete) => any): this;
  on(event: ClientEvents.COMMAND_RUN_ERROR, listener: (payload: CommandEvents.CommandRunError) => any): this;
  on(event: 'commandRunError', listener: (payload: CommandEvents.CommandRunError) => any): this;
  on(event: ClientEvents.KILLED, listener: () => any): this;
  on(event: 'killed', listener: () => any): this;
  on(event: string | symbol, listener: (...args: any[]) => void): this {
    super.on(event, listener);
    return this;
  }

  once(event: string | symbol, listener: (...args: any[]) => void): this;
  once(event: ClientEvents.COMMAND_DELETE, listener: (payload: CommandEvents.CommandDelete) => any): this;
  once(event: 'commandDelete', listener: (payload: CommandEvents.CommandDelete) => any): this;
  once(event: ClientEvents.COMMAND_ERROR, listener: (payload: CommandEvents.CommandError) => any): this;
  once(event: 'commandError', listener: (payload: CommandEvents.CommandError) => any): this;
  once(event: ClientEvents.COMMAND_FAIL, listener: (payload: CommandEvents.CommandFail) => any): this;
  once(event: 'commandFail', listener: (payload: CommandEvents.CommandFail) => any): this;
  once(event: ClientEvents.COMMAND_NONE, listener: (payload: CommandEvents.CommandNone) => any): this;
  once(event: 'commandNone', listener: (payload: CommandEvents.CommandNone) => any): this;
  once(event: ClientEvents.COMMAND_PERMISSIONS_FAIL_CLIENT, listener: (payload: CommandEvents.CommandPermissionsFailClient) => any): this;
  once(event: 'commandPermissionsFailClient', listener: (payload: CommandEvents.CommandPermissionsFailClient) => any): this;
  once(event: ClientEvents.COMMAND_PERMISSIONS_FAIL, listener: (payload: CommandEvents.CommandPermissionsFail) => any): this;
  once(event: 'commandPermissionsFail', listener: (payload: CommandEvents.CommandPermissionsFail) => any): this;
  once(event: ClientEvents.COMMAND_RAN, listener: (payload: CommandEvents.CommandRan) => any): this;
  once(event: 'commandRan', listener: (payload: CommandEvents.CommandRan) => any): this;
  once(event: ClientEvents.COMMAND_RATELIMIT, listener: (payload: CommandEvents.CommandRatelimit) => any): this;
  once(event: 'commandRatelimit', listener: (payload: CommandEvents.CommandRatelimit) => any): this;
  once(event: ClientEvents.COMMAND_RESPONSE_DELETE, listener: (payload: CommandEvents.CommandResponseDelete) => any): this;
  once(event: 'commandResponseDelete', listener: (payload: CommandEvents.CommandResponseDelete) => any): this;
  once(event: ClientEvents.COMMAND_RUN_ERROR, listener: (payload: CommandEvents.CommandRunError) => any): this;
  once(event: 'commandRunError', listener: (payload: CommandEvents.CommandRunError) => any): this;
  once(event: ClientEvents.KILLED, listener: () => any): this;
  once(event: 'killed', listener: () => any): this;
  once(event: string | symbol, listener: (...args: any[]) => void): this {
    super.once(event, listener);
    return this;
  }

  subscribe(event: string | symbol, listener: (...args: any[]) => void): EventSubscription;
  subscribe(event: ClientEvents.COMMAND_DELETE, listener: (payload: CommandEvents.CommandDelete) => any): EventSubscription;
  subscribe(event: 'commandDelete', listener: (payload: CommandEvents.CommandDelete) => any): EventSubscription;
  subscribe(event: ClientEvents.COMMAND_ERROR, listener: (payload: CommandEvents.CommandError) => any): EventSubscription;
  subscribe(event: 'commandError', listener: (payload: CommandEvents.CommandError) => any): EventSubscription;
  subscribe(event: ClientEvents.COMMAND_FAIL, listener: (payload: CommandEvents.CommandFail) => any): EventSubscription;
  subscribe(event: 'commandFail', listener: (payload: CommandEvents.CommandFail) => any): EventSubscription;
  subscribe(event: ClientEvents.COMMAND_NONE, listener: (payload: CommandEvents.CommandNone) => any): EventSubscription;
  subscribe(event: 'commandNone', listener: (payload: CommandEvents.CommandNone) => any): EventSubscription;
  subscribe(event: ClientEvents.COMMAND_PERMISSIONS_FAIL_CLIENT, listener: (payload: CommandEvents.CommandPermissionsFailClient) => any): EventSubscription;
  subscribe(event: 'commandPermissionsFailClient', listener: (payload: CommandEvents.CommandPermissionsFailClient) => any): EventSubscription;
  subscribe(event: ClientEvents.COMMAND_PERMISSIONS_FAIL, listener: (payload: CommandEvents.CommandPermissionsFail) => any): EventSubscription;
  subscribe(event: 'commandPermissionsFail', listener: (payload: CommandEvents.CommandPermissionsFail) => any): EventSubscription;
  subscribe(event: ClientEvents.COMMAND_RAN, listener: (payload: CommandEvents.CommandRan) => any): EventSubscription;
  subscribe(event: 'commandRan', listener: (payload: CommandEvents.CommandRan) => any): EventSubscription;
  subscribe(event: ClientEvents.COMMAND_RATELIMIT, listener: (payload: CommandEvents.CommandRatelimit) => any): EventSubscription;
  subscribe(event: 'commandRatelimit', listener: (payload: CommandEvents.CommandRatelimit) => any): EventSubscription;
  subscribe(event: ClientEvents.COMMAND_RESPONSE_DELETE, listener: (payload: CommandEvents.CommandResponseDelete) => any): EventSubscription;
  subscribe(event: 'commandResponseDelete', listener: (payload: CommandEvents.CommandResponseDelete) => any): EventSubscription;
  subscribe(event: ClientEvents.COMMAND_RUN_ERROR, listener: (payload: CommandEvents.CommandRunError) => any): EventSubscription;
  subscribe(event: 'commandRunError', listener: (payload: CommandEvents.CommandRunError) => any): EventSubscription;
  subscribe(event: ClientEvents.KILLED, listener: () => any): EventSubscription;
  subscribe(event: 'killed', listener: () => any): EventSubscription;
  subscribe(event: string | symbol, listener: (...args: any[]) => void): EventSubscription {
    return super.subscribe(event, listener);
  }
}
