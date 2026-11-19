import * as path from 'path';

import { EventSpewer, EventSubscription, Timers } from 'detritus-utils';

import { ShardClient } from './client';
import {
  ClusterClient,
  ClusterClientOptions,
  ClusterClientRunOptions,
} from './clusterclient';
import { ClientEvents, Permissions } from './constants';
import { ImportedCommandsError } from './errors';
import { GatewayClientEvents } from './gateway/clientevents';
import { InteractionCommandClient } from './interactioncommandclient';
import { ImportedFile, PermissionTools, importFilesIn } from './utils';

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
  CommandRatelimiter,
} from './commandratelimit';

import { BaseCollection, BaseSet } from './collections';
import { Message, Typing, User } from './structures';


export interface CommandClientOptions extends ClusterClientOptions {
  activateOnEdits?: boolean,
  ignoreMe?: boolean,
  maxEditDuration?: number,
  mentionsEnabled?: boolean,
  prefix?: string,
  prefixes?: Array<string>,
  prefixSpace?: boolean,
  ratelimit?: CommandRatelimitOptions,
  ratelimits?: Array<CommandRatelimitOptions>,
  ratelimiter?: CommandRatelimiter,
  useClusterClient?: boolean,

  onCommandCheck?: CommandClientCommandCheck,
  onCommandCancel?: CommandClientCommandCancel,
  onMessageCheck?: CommandClientMessageCheck,
  onMessageCancel?: CommandClientMessageCancel,
  onPrefixCheck?: CommandClientPrefixCheck,
}

export type CommandClientCommandCheck = (context: Context, command: Command) => Promise<boolean> | boolean;
export type CommandClientCommandCancel = (context: Context, command: Command) => unknown;
export type CommandClientMessageCheck = (context: Context) => Promise<boolean> | boolean;
export type CommandClientMessageCancel = (context: Context) => unknown;

export type CommandClientPrefixes = Array<string> | BaseSet<string> | Set<string> | string;
export type CommandClientPrefixCheck = (context: Context) => CommandClientPrefixes | Promise<CommandClientPrefixes>;

export interface CommandClientAdd extends CommandOptions {
  _class?: any,
}

export interface CommandClientRunOptions extends ClusterClientRunOptions {
  directories?: Array<string>,
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

export interface CommandRunning {
  // set once the message got deleted (or edited into not being a command) mid run, its reply gets reported instead of stored
  event: CommandEvents.CommandDelete['event'] | null,
  // the last reply already reported for it, so the same one isn't reported twice
  replyId: string | null,
}


function getPrefixEnd(content: string, contentLower: string, prefix: string): number {
  if (!contentLower.startsWith(prefix)) {
    return -1;
  }
  // find where the prefix ends in the original content, some characters change length when lowercased
  let index = 0;
  let length = 0;
  while (length < prefix.length && index < content.length) {
    const character = String.fromCodePoint(content.codePointAt(index)!);
    index += character.length;
    length += character.toLowerCase().length;
  }
  return (length === prefix.length) ? index : -1;
}


/**
 * Command Client, hooks onto a ClusterClient or ShardClient to provide easier command handling
 * Flow is `onMessageCheck` -> `onPrefixCheck` -> `onCommandCheck`
 * @category Clients
 */
export class CommandClient extends EventSpewer {
  readonly _clientSubscriptions: Array<EventSubscription> = [];
  // reply id -> command message id, entries can go stale so they're checked against `replies` and rebuilt once they pile up
  readonly _replyIds = new Map<string, string>();
  // command message id -> the runs still going for it (an edit can re-run a message while the original run is still going)
  readonly _running = new Map<string, Map<Context, CommandRunning>>();
  // command message id -> the `editOrReply()` going for it, the next one waits on it so two runs don't both post a reply
  readonly _replying = new Map<string, Promise<unknown>>();
  _killed: boolean = false;
  declare _ownsRatelimiter: boolean;
  _runPromise: Promise<ClusterClient | ShardClient> | null = null;

  activateOnEdits: boolean = false;
  client: ClusterClient | ShardClient;
  commands: Array<Command>;
  directories = new BaseCollection<string, {subdirectories: boolean}>();
  ignoreMe: boolean = true;
  maxEditDuration: number = 5 * 60 * 1000;
  mentionsEnabled: boolean = true;
  prefixSpace: boolean = false;
  prefixes: {
    custom: BaseSet<string>,
    mention: BaseSet<string>,
  };
  ran: boolean = false;
  ratelimits: Array<CommandRatelimit> = [];
  ratelimiter: CommandRatelimiter;
  replies: BaseCollection<string, CommandReply>;

  onCommandCheck?(context: Context, command: Command): Promise<boolean> | boolean;
  onCommandCancel?(context: Context, command: Command): unknown;
  onMessageCheck?(context: Context): Promise<boolean> | boolean;
  onMessageCancel?(context: Context): unknown;
  onPrefixCheck?(context: Context): CommandClientPrefixes | Promise<CommandClientPrefixes>;

  constructor(
    token: ClusterClient | ShardClient | InteractionCommandClient | string,
    options: CommandClientOptions = {},
  ) {
    super();
    options = Object.assign({useClusterClient: true}, options);

    if (token instanceof InteractionCommandClient) {
      token = token.client;
    }

    if (process.env.CLUSTER_MANAGER === 'true') {
      options.useClusterClient = true;
      if (token instanceof ClusterClient) {
        if (process.env.CLUSTER_TOKEN !== token.token) {
          throw new Error('Cluster Client must have matching tokens with the Manager!');
        }
      } else {
        token = process.env.CLUSTER_TOKEN as string;
      }
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
    if (this.client instanceof ClusterClient) {
      for (let [shardId, shard] of this.client.shards) {
        Object.defineProperty(shard, 'commandClient', {value: this});
      }
    }

    this.activateOnEdits = !!options.activateOnEdits || this.activateOnEdits;
    this.commands = [];
    this.ignoreMe = (options.ignoreMe !== undefined) ? !!options.ignoreMe : this.ignoreMe;
    this.maxEditDuration = +((options.maxEditDuration !== undefined) ? options.maxEditDuration : this.maxEditDuration);
    this.mentionsEnabled = !!(options.mentionsEnabled || options.mentionsEnabled === undefined);
    this.prefixSpace = !!options.prefixSpace;
    this.prefixes = Object.freeze({
      custom: new BaseSet<string>(),
      mention: new BaseSet<string>(),
    });
    this.ratelimiter = options.ratelimiter || new CommandRatelimiter();
    // one passed in may be shared with other clients, only clear ours on a kill
    Object.defineProperty(this, '_ownsRatelimiter', {configurable: true, enumerable: false, writable: false, value: !options.ratelimiter});
    this.replies = new BaseCollection({expire: this.maxEditDuration});

    this.onCommandCheck = options.onCommandCheck || this.onCommandCheck;
    this.onCommandCancel = options.onCommandCancel || this.onCommandCancel;
    this.onMessageCheck = options.onMessageCheck || this.onMessageCheck;
    this.onMessageCancel = options.onMessageCancel || this.onMessageCancel;
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
        // message content is lowercased before matching, so prefixes have to be too
        prefix = prefix.trim().toLowerCase();
        if (this.prefixSpace) {
          prefix += ' ';
        }
        this.prefixes.custom.add(prefix);
      }
    }

    if (this.client.ran) {
      this.addMentionPrefixes();
    }

    if (options.ratelimit) {
      this.ratelimits.push(new CommandRatelimit(options.ratelimit));
    }
    if (options.ratelimits) {
      for (let rOptions of options.ratelimits) {
        if (typeof(rOptions.type) === 'string') {
          const rType = (rOptions.type || '').toLowerCase();
          if (this.ratelimits.some((ratelimit) => ratelimit.type === rType)) {
            throw new Error(`Ratelimit with type ${rType} already exists`);
          }
        }
        this.ratelimits.push(new CommandRatelimit(rOptions));
      }
    }

    if (!this.prefixes.custom.size && !this.mentionsEnabled) {
      throw new Error('You must pass in prefixes or enable mentions!');
    }

    Object.defineProperties(this, {
      _clientSubscriptions: {enumerable: false, writable: false},
      _replyIds: {enumerable: false, writable: false},
      _running: {enumerable: false, writable: false},
      _replying: {enumerable: false, writable: false},
      _killed: {configurable: true, enumerable: false, writable: false},
      _runPromise: {enumerable: false, writable: true},
      activateOnEdits: {configurable: true, writable: false},
      commands: {writable: false},
      maxEditDuration: {configurable: true, writable: false},
      mentionsEnabled: {configurable: true, writable: false},
      prefixes: {writable: false},
      prefixSpace: {configurable: true, writable: false},
      ran: {configurable: true, writable: false},

      onCommandCheck: {enumerable: false, writable: true},
      onCommandCancel: {enumerable: false, writable: true},
      onMessageCheck: {enumerable: false, writable: true},
      onMessageCancel: {enumerable: false, writable: true},
      onPrefixCheck: {enumerable: false, writable: true},
    });
  }

  get killed(): boolean {
    return this._killed;
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
    if (value) {
      this.replies.setIntervalTimeout(Math.min(value, 5000));
    } else {
      // nothing would expire the stored replies anymore and none get stored from now on, so drop them
      this.replies.clear();
      this._replyIds.clear();
    }
    this.replies.setExpire(value);
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
        // arrow functions have no `.prototype` and can't be constructed
        if (options._class.prototype) {
          command = new options._class(this, options);
        } else {
          // a plain function, `ts-node` outputs these
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
    if (!this._clientSubscriptions.length) {
      this.setSubscriptions();
    }
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
    options = Object.assign({subdirectories: true}, options);
    if (!options.isAbsolute) {
      if (require.main) {
        // `require.main.path` isn't typed
        directory = path.join(path.dirname(require.main.filename), directory);
      }
    }
    this.directories.set(directory, {subdirectories: !!options.subdirectories});

    const { errors, files } = await importFilesIn(directory, !!options.subdirectories);
    this.addImported(files, errors);

    if (Object.keys(errors).length) {
      throw new ImportedCommandsError(errors);
    }

    return this;
  }

  // adds the commands exported by imported files, a file whose command fails to add goes into `errors`
  addImported(files: Array<ImportedFile>, errors: Record<string, Error>): void {
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
    for (let { filepath, imported } of files) {
      try {
        addCommand(imported, filepath);
      } catch(error: any) {
        errors[filepath] = error;
      }
    }
  }

  clear(): void {
    this.clearRequireCache();
    this.clearCommands();
  }

  clearCommands(): void {
    this.commands.length = 0;
    this.clearSubscriptions();
  }

  clearRequireCache(): void {
    for (let command of this.commands) {
      if (command._file) {
        let requirePath = command._file;
        try {
          requirePath = require.resolve(command._file);
        } catch(error) {
          // the file got deleted or renamed, `_file` is already an absolute path from importing it
        }
        delete require.cache[requirePath];
      }
    }
  }

  clearSubscriptions(): void {
    while (this._clientSubscriptions.length) {
      const subscription = this._clientSubscriptions.shift();
      if (subscription) {
        subscription.remove();
      }
    }
  }

  async resetCommands(): Promise<void> {
    // import before dropping the old commands, messages coming in while importing still need them (the swap is synchronous)
    this.clearRequireCache();
    const errors: Record<string, Error> = {};
    const files: Array<ImportedFile> = [];
    for (let [directory, options] of this.directories) {
      const imported = await importFilesIn(directory, options.subdirectories, true);
      Object.assign(errors, imported.errors);
      files.push(...imported.files);
    }

    this.clearCommands();
    this.addImported(files, errors);

    if (Object.keys(errors).length) {
      throw new ImportedCommandsError(errors);
    }
  }
  /* end */

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

  async getAttributes(context: Context): Promise<CommandAttributes | null> {
    let content = context.message.content.trim();
    let contentLower = content.toLowerCase();
    if (!content) {
      return null;
    }

    let prefix: string = '';
    let prefixEnd: number = -1;
    if (this.mentionsEnabled) {
      if (!this.prefixes.mention.length) {
        this.addMentionPrefixes();
      }
      for (let mention of this.prefixes.mention) {
        prefixEnd = getPrefixEnd(content, contentLower, mention);
        if (prefixEnd !== -1) {
          prefix = mention;
          break;
        }
      }
    }
    if (!prefix) {
      const customPrefixes = await Promise.resolve(this.getPrefixes(context));
      for (let custom of customPrefixes) {
        // lowercase again in case `prefixes.custom` was added to directly
        custom = custom.toLowerCase();
        if (custom) {
          prefixEnd = getPrefixEnd(content, contentLower, custom);
          if (prefixEnd !== -1) {
            prefix = custom;
            break;
          }
        }
      }
    }
    if (prefix) {
      content = content.substring(prefixEnd).trim();
      return {content, prefix};
    }
    return null;
  }

  async getCommand(attributes: CommandAttributes, context?: Context): Promise<Command | null> {
    if (attributes.content) {
      const insensitive = attributes.content.toLowerCase();
      // the longest matching name wins between commands of the same priority, so `tag` doesn't shadow `tag get`
      let found: {command: Command, name: string} | null = null;
      for (let command of this.commands) {
        if (found && command.priority < found.command.priority) {
          // sorted by priority, nothing after this can win
          break;
        }
        const name = command.getName(insensitive);
        if (name && (!found || found.name.length < name.length)) {
          found = {command, name};
        }
      }
      if (found) {
        attributes.content = attributes.content.substring(found.name.length).trim();
        return found.command;
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
      // used as-is (a trailing space like `"bot "` is kept), only lowercased to match the lowercased content
      sorted = sorted.map((prefix) => prefix.toLowerCase());
      return new BaseSet(sorted.sort((x, y) => y.length - x.length));
    }
    return this.prefixes.custom;
  }

  setSubscriptions(): void {
    this.clearSubscriptions();

    const subscriptions = this._clientSubscriptions;
    subscriptions.push(this.client.subscribe(ClientEvents.MESSAGE_CREATE, this.handleMessageCreate.bind(this)));
    subscriptions.push(this.client.subscribe(ClientEvents.MESSAGE_DELETE, this.handleDelete.bind(this, ClientEvents.MESSAGE_DELETE)));
    subscriptions.push(this.client.subscribe(ClientEvents.MESSAGE_DELETE_BULK, this.handleDeleteBulk.bind(this)));
    subscriptions.push(this.client.subscribe(ClientEvents.MESSAGE_UPDATE, this.handleMessageUpdate.bind(this)));
  }

  /* Kill/Run */
  kill(): void {
    Object.defineProperty(this, '_killed', {value: true});
    this.client.kill();
    this.emit(ClientEvents.KILLED);
    this.clearSubscriptions();
    this.removeAllListeners();
    // the stored replies' expiry interval and the ratelimit timers would keep the process alive
    this.replies.clear();
    this._replyIds.clear();
    this._running.clear();
    this._replying.clear();
    if (this._ownsRatelimiter) {
      this.ratelimiter.clear();
    }
  }

  async run(
    options: CommandClientRunOptions = {},
  ): Promise<ClusterClient | ShardClient> {
    if (this.ran) {
      return this.client;
    }
    // concurrent calls share one run, a second would import the directories again and run the client twice
    if (!this._runPromise) {
      const promise = (async () => {
        if (options.directories) {
          for (let directory of options.directories) {
            await this.addMultipleIn(directory);
          }
        }
        await this.client.run(options);
        this.addMentionPrefixes();
        Object.defineProperty(this, 'ran', {value: true});
        return this.client;
      })();
      this._runPromise = promise;
      // once it settles `ran` guards a success, and a failed run can be retried
      const settle = () => {
        if (this._runPromise === promise) {
          this._runPromise = null;
        }
      };
      promise.then(settle, settle);
    }
    return this._runPromise;
  }

  // marks the runs still going for a message (the ones before `before`), so their later replies get reported instead of stored
  _markRunning(
    messageId: string,
    event: CommandEvents.CommandDelete['event'],
    replyId: string | null,
    before?: Context,
  ): void {
    const runs = this._running.get(messageId);
    if (runs) {
      for (let [context, running] of runs) {
        if (context === before) {
          // runs after it came from a newer edit
          break;
        }
        if (!running.event) {
          running.event = event;
          running.replyId = replyId;
        }
      }
    }
  }

  storeReply(messageId: string, command: Command, context: Context, reply: Message | void): void {
    if (this._killed) {
      return;
    }
    if (this.maxEditDuration && reply instanceof Message) {
      const runs = this._running.get(messageId);
      const running = (runs) ? runs.get(context) : undefined;
      if (running && running.event) {
        // the message is gone (or isn't a command anymore), report the reply like a delete after replying would
        if (running.replyId !== reply.id) {
          running.replyId = reply.id;
          const payload: CommandEvents.CommandDelete = {command, context, event: running.event, reply};
          this.emit(ClientEvents.COMMAND_DELETE, payload);
        }
        return;
      }
      this.replies.set(messageId, {command, context, reply});
      this._replyIds.set(reply.id, messageId);
      if (Math.max(this.replies.length * 2, 100) < this._replyIds.size) {
        this.rebuildReplyIds();
      }
    }
  }

  // drops the stale entries of `_replyIds`
  rebuildReplyIds(): void {
    this._replyIds.clear();
    for (let [messageId, { reply }] of this.replies) {
      this._replyIds.set(reply.id, messageId);
    }
  }

  // the command message id of a stored reply, if it's still the current reply of that command
  getReplyCommandId(replyId: string): string | null {
    const messageId = this._replyIds.get(replyId);
    if (messageId !== undefined) {
      const stored = this.replies.get(messageId);
      if (stored && stored.reply.id === replyId) {
        return messageId;
      }
      this._replyIds.delete(replyId);
    }
    return null;
  }

  /* Handler */
  async handleMessageCreate(event: GatewayClientEvents.MessageCreate) {
    return this.handle(ClientEvents.MESSAGE_CREATE, event);
  }

  isContentEdit(event: GatewayClientEvents.MessageUpdate): boolean {
    const { differences, raw } = event;
    if (differences) {
      // `differences` holds the old values, an old content of '' (like an attachment only message) is still a change
      return 'content' in differences;
    }
    // uncached, and updates send the whole message (pins, threads, etc), so only count it if it was edited just now
    if (!raw || raw.content === undefined || !raw.edited_timestamp) {
      return false;
    }
    return Math.abs(Date.now() - Date.parse(raw.edited_timestamp)) <= this.maxEditDuration;
  }

  isWithinEditDuration(message: Message): boolean {
    if (message.isEdited) {
      return (message.editedAtUnix - message.timestampUnix) <= this.maxEditDuration;
    }
    return true;
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

    if (name === ClientEvents.MESSAGE_UPDATE) {
      // only content edits can re-run a command (not pins, embeds loading, etc)
      if (!this.activateOnEdits || !this.isContentEdit(event as GatewayClientEvents.MessageUpdate)) {
        return;
      }
    }

    const context = new Context(message, typing, this);
    // tracked until it's done, so a delete (or an edit) mid run doesn't leave its later reply stored
    let runs = this._running.get(message.id);
    if (!runs) {
      runs = new Map();
      this._running.set(message.id, runs);
    }
    runs.set(context, {event: null, replyId: null});
    try {
      await this.handleContext(name, event, context);
    } finally {
      if (name === ClientEvents.MESSAGE_UPDATE && !context.command && this.isWithinEditDuration(message)) {
        let replyId: string | null = null;
        if (this.replies.has(message.id)) {
          // the edit doesn't run a command anymore, so its old reply is stale (a re-run keeps it for `editOrReply()` to edit)
          const { command, context: oldContext, reply } = this.replies.get(message.id)!;
          this.replies.delete(message.id);
          replyId = reply.id;
          const payload: CommandEvents.CommandDelete = {command, context: oldContext, event: ClientEvents.MESSAGE_UPDATE, reply};
          this.emit(ClientEvents.COMMAND_DELETE, payload);
        }
        // runs from before the edit that are still going would store their reply later and bring it back
        this._markRunning(message.id, ClientEvents.MESSAGE_UPDATE, replyId, context);
      }
      const command = context.command;
      if (command && typeof(command.onFinally) === 'function') {
        try {
          await Promise.resolve(command.onFinally(context));
        } catch(error: any) {
          const payload: CommandEvents.CommandError = {command, context, error};
          this.emit(ClientEvents.COMMAND_ERROR, payload);
        }
      }
      // look it up again, `kill()` clears the map
      const current = this._running.get(message.id);
      if (current) {
        current.delete(context);
        if (!current.size) {
          this._running.delete(message.id);
        }
      }
    }
  }

  async handleContext(
    name: ClientEvents.MESSAGE_CREATE | ClientEvents.MESSAGE_UPDATE,
    event: GatewayClientEvents.MessageCreate | GatewayClientEvents.MessageUpdate,
    context: Context,
  ): Promise<void> {
    const { message } = context;
    if (typeof(this.onMessageCheck) === 'function') {
      try {
        const shouldContinue = await Promise.resolve(this.onMessageCheck(context));
        if (!shouldContinue) {
          if (typeof(this.onMessageCancel) === 'function') {
            await Promise.resolve(this.onMessageCancel(context));
            return;
          }
          const error = new Error('Message check returned false');
          const payload: CommandEvents.CommandNone = {context, error};
          this.emit(ClientEvents.COMMAND_NONE, payload);
          return;
        }
      } catch(error: any) {
        const payload: CommandEvents.CommandNone = {context, error};
        this.emit(ClientEvents.COMMAND_ERROR, payload);
        return;
      }
    }

    if (name === ClientEvents.MESSAGE_UPDATE) {
      if (!this.activateOnEdits || !this.isContentEdit(event as GatewayClientEvents.MessageUpdate)) {
        return;
      }
    }

    let attributes: CommandAttributes | null = null;
    try {
      if (!message.fromUser) {
        throw new Error('Message is not from a user.');
      }

      if (!this.isWithinEditDuration(message)) {
        throw new Error('Edit timestamp is higher than max edit duration');
      }

      attributes = await this.getAttributes(context);
      if (!attributes) {
        throw new Error('Does not start with any allowed prefixes');
      }
    } catch(error: any) {
      const payload: CommandEvents.CommandNone = {context, error};
      this.emit(ClientEvents.COMMAND_NONE, payload);
      return;
    }

    let command: Command | null = null;
    try {
      command = await await Promise.resolve(this.getCommand(attributes, context));
    } catch(error: any) {
      const payload: CommandEvents.CommandNone = {context, error};
      this.emit(ClientEvents.COMMAND_ERROR, payload);
      return;
    }

    if (command) {
      context.command = command;
      if (typeof(this.onCommandCheck) === 'function') {
        try {
          const shouldContinue = await Promise.resolve(this.onCommandCheck(context, command));
          if (!shouldContinue) {
            if (typeof(this.onCommandCancel) === 'function') {
              await Promise.resolve(this.onCommandCancel(context, command));
              return;
            }
            const error = new Error('Command check returned false');
            const payload: CommandEvents.CommandNone = {context, error};
            this.emit(ClientEvents.COMMAND_NONE, payload);
            return;
          }
        } catch(error: any) {
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

    if (context.inDm) {
      if (command.disableDm) {
        if (typeof(command.onDmBlocked) === 'function') {
          try {
            const reply = await Promise.resolve(command.onDmBlocked(context));
            this.storeReply(message.id, command, context, reply);
          } catch(error: any) {
            const payload: CommandEvents.CommandError = {command, context, error};
            this.emit(ClientEvents.COMMAND_ERROR, payload);
          }
        } else {
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
            } catch(e: any) {
              const payload: CommandEvents.CommandError = {command, context, error, extra: e};
              this.emit(ClientEvents.COMMAND_ERROR, payload);
            }
          }
        }
        return;
      }
    } else {
      // the bot's permissions are never skipped, the command most likely relies on them
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
              const reply = await Promise.resolve(command.onPermissionsFailClient(context, failed));
              this.storeReply(message.id, command, context, reply);
            } catch(error: any) {
            }
          }
          return;
        }
      }

      if (!command.permissionsIgnoreClientOwner || !context.user.isClientOwner) {
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
                const reply = await Promise.resolve(command.onPermissionsFail(context, failed));
                this.storeReply(message.id, command, context, reply);
              } catch(error: any) {
              }
            }
            return;
          }
        }
      }
    }

    if (this.ratelimits.length || command.ratelimits.length) {
      const now = Date.now();
      {
        const ratelimits = this.ratelimiter.getExceeded(context, this.ratelimits, now);
        if (ratelimits.length) {
          const global = true;

          const payload: CommandEvents.CommandRatelimit = {command, context, global, ratelimits, now};
          this.emit(ClientEvents.COMMAND_RATELIMIT, payload);

          if (typeof(command.onRatelimit) === 'function') {
            try {
              const reply = await Promise.resolve(command.onRatelimit(context, ratelimits, {global, now}));
              this.storeReply(message.id, command, context, reply);
            } catch(error: any) {
            }
          }
          return;
        }
      }

      {
        const ratelimits = this.ratelimiter.getExceeded(context, command.ratelimits, now);
        if (ratelimits.length) {
          const global = false;

          const payload: CommandEvents.CommandRatelimit = {command, context, global, ratelimits, now};
          this.emit(ClientEvents.COMMAND_RATELIMIT, payload);

          if (typeof(command.onRatelimit) === 'function') {
            try {
              const reply = await Promise.resolve(command.onRatelimit(context, ratelimits, {global, now}));
              this.storeReply(message.id, command, context, reply);
            } catch(error: any) {
            }
          }
          return;
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
      } catch(error: any) {
        const payload: CommandEvents.CommandError = {command, context, error};
        this.emit(ClientEvents.COMMAND_ERROR, payload);
        return;
      }
    }

    const prefix = context.prefix = attributes.prefix;
    const {errors, parsed: args} = await command.getArgs(attributes, context);
    if (Object.keys(errors).length) {
      if (typeof(command.onTypeError) === 'function') {
        try {
          const reply = await Promise.resolve(command.onTypeError(context, args, errors));
          this.storeReply(message.id, command, context, reply);
        } catch(error: any) {
          const payload: CommandEvents.CommandError = {command, context, error, extra: errors};
          this.emit(ClientEvents.COMMAND_ERROR, payload);
        }
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
        const shouldTriggerLoading = command.triggerTypingAfter !== undefined && 0 <= command.triggerTypingAfter;
        const shouldTriggerOnEdits = !!command.triggerTypingOnEdits;
        // typing only makes sense if `editOrReply` will send a new message rather than edit the stored reply
        const expectsNewMessage = () => {
          if (this.replies.has(context.messageId)) {
            const { reply } = this.replies.get(context.messageId)!;
            return !reply.canEdit;
          }
          return true;
        };
        if (shouldTriggerLoading) {
          if (command.triggerTypingAfter) {
            timeout = new Timers.Timeout();
            Object.defineProperty(context, 'typingTimeout', {value: timeout});
            timeout.start(command.triggerTypingAfter, async () => {
              try {
                if (command && typeof(command.onTypingTrigger) === 'function') {
                  await Promise.resolve(command.onTypingTrigger(context));
                } else if (shouldTriggerOnEdits || expectsNewMessage()) {
                  await context.triggerTyping();
                }
              } catch(error) {
              }
            });
          } else {
            try {
              if (command && typeof(command.onTypingTrigger) === 'function') {
                await Promise.resolve(command.onTypingTrigger(context));
              } else if (shouldTriggerOnEdits || expectsNewMessage()) {
                await context.triggerTyping();
              }
            } catch(error) {
            }
          }
        }

        if (typeof(command.run) === 'function') {
          const reply = await Promise.resolve(command.run(context, args));
          this.storeReply(message.id, command, context, reply);
        }

        if (timeout) {
          timeout.stop();
        }
      } catch(error: any) {
        if (timeout) {
          timeout.stop();
        }

        const payload: CommandEvents.CommandRunError = {args, command, context, error, prefix};
        this.emit(ClientEvents.COMMAND_RUN_ERROR, payload);
        if (typeof(command.onRunError) === 'function') {
          try {
            const reply = await Promise.resolve(command.onRunError(context, args, error));
            this.storeReply(message.id, command, context, reply);
          } catch(e: any) {
            const payload: CommandEvents.CommandError = {command, context, error: e, extra: error};
            this.emit(ClientEvents.COMMAND_ERROR, payload);
          }
        }
        return;
      }

      const payload: CommandEvents.CommandRan = {args, command, context, prefix};
      this.emit(ClientEvents.COMMAND_RAN, payload);
      if (typeof(command.onSuccess) === 'function') {
        await Promise.resolve(command.onSuccess(context, args));
      }
    } catch(error: any) {
      if (typeof(command.onError) === 'function') {
        try {
          await Promise.resolve(command.onError(context, args, error));
        } catch(e: any) {
          const payload: CommandEvents.CommandError = {command, context, error: e, extra: error};
          this.emit(ClientEvents.COMMAND_ERROR, payload);
        }
      }
      const payload: CommandEvents.CommandFail = {args, command, context, error, prefix};
      this.emit(ClientEvents.COMMAND_FAIL, payload);
    }
  }

  async handleDelete(name: ClientEvents.MESSAGE_DELETE, deletePayload: {raw: {id: string}}): Promise<void> {
    const messageId = deletePayload.raw.id;
    if (this.replies.has(messageId)) {
      const { command, context, reply } = this.replies.get(messageId)!;
      this.replies.delete(messageId);
      // runs still going (like an edit's re-run) would store a reply for a message that's gone
      this._markRunning(messageId, name, reply.id);

      const payload: CommandEvents.CommandDelete = {command, context, event: name, reply};
      this.emit(ClientEvents.COMMAND_DELETE, payload);
    } else {
      // deleted before its run replied, the reply gets reported once the run stores it
      this._markRunning(messageId, name, null);

      const commandId = this.getReplyCommandId(messageId);
      if (commandId !== null) {
        const { command, context, reply } = this.replies.get(commandId)!;
        this.replies.delete(commandId);
        this._replyIds.delete(messageId);

        const payload: CommandEvents.CommandResponseDelete = { command, context, reply };
        this.emit(ClientEvents.COMMAND_RESPONSE_DELETE, payload);
      }
    }
  }

  // purges, same as `handleDelete()` for each message (command messages first, then responses)
  async handleDeleteBulk(deletePayload: {raw: {ids: Array<string>}}): Promise<void> {
    const messageIds = new Set(deletePayload.raw.ids);
    for (let messageId of messageIds) {
      if (this.replies.has(messageId)) {
        const { command, context, reply } = this.replies.get(messageId)!;
        this.replies.delete(messageId);
        this._markRunning(messageId, ClientEvents.MESSAGE_DELETE_BULK, reply.id);

        const payload: CommandEvents.CommandDelete = {command, context, event: ClientEvents.MESSAGE_DELETE_BULK, reply};
        this.emit(ClientEvents.COMMAND_DELETE, payload);
      } else {
        this._markRunning(messageId, ClientEvents.MESSAGE_DELETE_BULK, null);
      }
    }
    for (let messageId of messageIds) {
      const commandId = this.getReplyCommandId(messageId);
      if (commandId !== null) {
        const { command, context, reply } = this.replies.get(commandId)!;
        this.replies.delete(commandId);
        this._replyIds.delete(messageId);

        const payload: CommandEvents.CommandResponseDelete = {command, context, reply};
        this.emit(ClientEvents.COMMAND_RESPONSE_DELETE, payload);
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
