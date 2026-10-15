import * as path from 'path';

import { RequestTypes } from 'detritus-client-rest';
import { EventSpewer, EventSubscription, Timers } from 'detritus-utils';

import { ShardClient } from './client';
import {
  ClusterClient,
  ClusterClientOptions,
  ClusterClientRunOptions,
} from './clusterclient';
import { ClusterProcessChild } from './cluster/processchild';
import { BaseCollection, BaseSet } from './collections';
import { CommandClient } from './commandclient';
import {
  ApplicationCommandOptionTypes,
  ApplicationCommandTypes,
  ClientEvents,
  ClusterIPCOpCodes,
  DetritusKeys,
  DiscordKeys,
  InteractionCallbackTypes,
  InteractionTypes,
  MessageFlags,
  Permissions,
  FILE_EXTENSIONS_IMPORT,
  LOCAL_GUILD_ID,
} from './constants';
import { ImportedCommandsError } from './errors';
import { GatewayClientEvents } from './gateway/clientevents';
import {
  ApplicationCommand,
  InteractionDataApplicationCommand,
  InteractionDataApplicationCommandOption,
  InteractionDataApplicationCommandResolved,
} from './structures';
import { PermissionTools, diffApplicationCommands, getFiles, requireOrImport } from './utils';

import {
  CommandRatelimit,
  CommandRatelimitOptions,
  CommandRatelimiter,
} from './commandratelimit';

import {
  CommandCallbackRun,
  ParsedArgs,
  ParsedErrors,
  InteractionAutoCompleteContext,
  InteractionCommand,
  InteractionCommandEvents,
  InteractionCommandOption,
  InteractionCommandOptions,
  InteractionContext,
} from './interaction';
import { Regexes } from './utils/markup';


export interface InteractionCommandClientOptions extends ClusterClientOptions {
  checkCommands?: boolean,
  ratelimit?: CommandRatelimitOptions,
  ratelimits?: Array<CommandRatelimitOptions>,
  ratelimiter?: CommandRatelimiter,
  strictCommandCheck?: boolean,
  useClusterClient?: boolean,

  onCommandCheck?: InteractionCommandClientCommandCheck,
  onCommandCancel?: InteractionCommandClientCommandCancel,
  onInteractionCheck?: InteractionCommandClientInteractionCheck,
  onInteractionCancel?: InteractionCommandClientInteractionCancel,
}

export type InteractionCommandClientCommandCheck = (context: InteractionContext, command: InteractionCommand) => Promise<boolean> | boolean;
export type InteractionCommandClientCommandCancel = (context: InteractionContext, command: InteractionCommand) => unknown;
export type InteractionCommandClientInteractionCheck = (context: InteractionContext) => Promise<boolean> | boolean;
export type InteractionCommandClientInteractionCancel = (context: InteractionContext) => unknown;

export interface InteractionCommandClientAddOptions extends InteractionCommandOptions {
  _class?: any,
}

export interface InteractionCommandIndex {
  byId: Map<string, InteractionCommand>,
  // `type.name` keys
  byName: Map<string, InteractionCommand>,
  byNameWithoutId: Map<string, InteractionCommand>,
}

export interface ApplicationCommandsPlan {
  changes: number,
  create: Array<InteractionCommand>,
  delete: Array<ApplicationCommand>,
  edit: Array<{differences: Array<string>, local: InteractionCommand, remote: ApplicationCommand}>,
}

export interface InteractionCommandClientRunOptions extends ClusterClientRunOptions {
  directories?: Array<string>,
}


/**
 * Interaction Command Client, hooks onto a ClusterClient or ShardClient to provide easier command handling
 * Flow is `onInteractionCheck` -> `onCommandCheck`
 * @category Clients
 */
export class InteractionCommandClient extends EventSpewer {
  readonly _clientSubscriptions: Array<EventSubscription> = [];

  checkCommands: boolean = true;
  client: ClusterClient | ShardClient;
  commands = new BaseSet<InteractionCommand>();
  commandsById = new BaseCollection<string, BaseSet<InteractionCommand>>();
  // scope -> lookups for `findCommand()` so it isn't a scan per interaction, dropped whenever commands or their ids change
  _commandIndex = new Map<string, InteractionCommandIndex>();
  // every scope we've synced, a scope whose local commands were all removed (like on a reload) still needs its remote ones deleted
  readonly _syncedScopes = new Set<string>();
  directories = new BaseCollection<string, {subdirectories: boolean}>();
  ran: boolean = false;
  ratelimits: Array<CommandRatelimit> = [];
  ratelimiter: CommandRatelimiter;
  strictCommandCheck: boolean = true;

  onCommandCheck?(context: InteractionContext, command: InteractionCommand): Promise<boolean> | boolean;
  onCommandCancel?(context: InteractionContext, command: InteractionCommand): unknown;
  onInteractionCheck?(context: InteractionContext): Promise<boolean> | boolean;
  onInteractionCancel?(context: InteractionContext): unknown;

  constructor(
    token: ClusterClient | CommandClient | ShardClient | string,
    options: InteractionCommandClientOptions = {},
  ) {
    super();
    options = Object.assign({useClusterClient: true}, options);

    this.checkCommands = (options.checkCommands || options.checkCommands === undefined);
    this.ratelimiter = options.ratelimiter || new CommandRatelimiter();
    this.strictCommandCheck = (options.strictCommandCheck || options.strictCommandCheck === undefined);
  
    this.onCommandCheck = options.onCommandCheck || this.onCommandCheck;
    this.onCommandCancel = options.onCommandCancel || this.onCommandCancel;
    this.onInteractionCheck = options.onInteractionCheck || this.onInteractionCheck;
    this.onInteractionCancel = options.onInteractionCancel || this.onInteractionCancel;

    if (token instanceof CommandClient) {
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
    Object.defineProperty(this.client, 'interactionCommandClient', {value: this});
    if (this.client instanceof ClusterClient) {
      for (let [shardId, shard] of this.client.shards) {
        Object.defineProperty(shard, 'interactionCommandClient', {value: this});
      }
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

    Object.defineProperties(this, {
      _clientSubscriptions: {enumerable: false, writable: false},
      ran: {configurable: true, writable: false},

      onCommandCheck: {enumerable: false, writable: true},
      onCommandCancel: {enumerable: false, writable: true},
      onInteractionCheck: {enumerable: false, writable: true},
      onInteractionCancel: {enumerable: false, writable: true},
    });
  }

  get canUpload(): boolean {
    if (this.manager) {
      // only upload on the first cluster process
      return this.manager.clusterId === 0;
    }
    return true;
  }

  get manager(): ClusterProcessChild | null {
    return (this.client instanceof ClusterClient) ? this.client.manager : null;
  }

  get rest() {
    return this.client.rest;
  }

  /* Generic Command Function */
  add(
    options: InteractionCommand | InteractionCommandClientAddOptions,
    run?: CommandCallbackRun,
  ): this {
    let command: InteractionCommand;
    if (options instanceof InteractionCommand) {
      command = options;
    } else {
      if (run !== undefined) {
        options.run = run;
      }
      // create a normal command class with the options given
      if (options._class === undefined) {
        command = new InteractionCommand(options);
      } else {
        // check for `.constructor` to make sure it's a class
        if (options._class.constructor) {
          command = new options._class(options);
        } else {
          // else it's just a function, `ts-node` outputs these
          command = options._class(options);
        }
        if (!command._file) {
          Object.defineProperty(command, '_file', {value: options._file});
        }
      }
    }

    command._transferValuesToChildren();
    if (!command.hasRun) {
      throw new Error('Command needs a run function');
    }
    this.commands.add(command);

    const guildIds = (command.guildIds) ? command.guildIds.toArray() : [];
    if (command.global) {
      guildIds.unshift(LOCAL_GUILD_ID);
    }
    for (let guildId of guildIds) {
      let commands: BaseSet<InteractionCommand>;
      if (this.commandsById.has(guildId)) {
        commands = this.commandsById.get(guildId)!;
      } else {
        commands = new BaseSet();
        this.commandsById.set(guildId, commands);
      }
      commands.add(command);
    }
    this._commandIndex.clear();

    if (!this._clientSubscriptions.length) {
      this.setSubscriptions();
    }
    return this;
  }

  addMultiple(commands: Array<InteractionCommand | InteractionCommandOptions> = []): this {
    for (let command of commands) {
      this.add(command);
    }
    return this;
  }

  async addMultipleIn(
    directory: string,
    options: {isAbsolute?: boolean, subdirectories?: boolean} = {},
  ): Promise<this> {
    options = Object.assign({subdirectories: true}, options);
    if (!options.isAbsolute) {
      if (require.main) {
        // require.main.path exists but typescript doesn't let us use it..
        directory = path.join(path.dirname(require.main.filename), directory);
      }
    }
    this.directories.set(directory, {subdirectories: !!options.subdirectories});

    const files: Array<string> = await getFiles(directory, options.subdirectories);
    const errors: Record<string, Error> = {};

    const addCommand = (imported: any, filepath: string): void => {
      if (!imported) {
        return;
      }
      if (typeof(imported) === 'function') {
        this.add({_file: filepath, _class: imported, name: ''});
      } else if (imported instanceof InteractionCommand) {
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
      if (!FILE_EXTENSIONS_IMPORT.some((ext) => file.endsWith(ext))) {
        continue;
      }
      const filepath = path.resolve(directory, file);
      try {
        let importedCommand: any = await requireOrImport(filepath);
        if (typeof(importedCommand) === 'object' && importedCommand.__esModule) {
          importedCommand = importedCommand.default;
        }
        addCommand(importedCommand, filepath);
      } catch(error: any) {
        errors[filepath] = error;
      }
    }

    if (Object.keys(errors).length) {
      throw new ImportedCommandsError(errors);
    }

    return this;
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
    this.commands.clear();
    for (let [guildId, commands] of this.commandsById) {
      commands.clear();
      this.commandsById.delete(guildId);
    }
    this.commandsById.clear();
    this._commandIndex.clear();
    this.clearSubscriptions();
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
    this.clear();
    for (let [directory, options] of this.directories) {
      await this.addMultipleIn(directory, {isAbsolute: true, ...options});
    }
    await this.checkAndUploadCommands();
  }

  /* Application Command Checking */
  async checkApplicationCommands(guildId?: string): Promise<boolean> {
    if (!this.client.ran) {
      return false;
    }
    const commands = await this.fetchApplicationCommands(guildId);
    return this.validateCommands(commands, guildId);
  }

  async checkAndUploadCommands(force: boolean = false): Promise<void> {
    if (!this.client.ran) {
      return;
    }
    // also go over scopes without local commands, so the commands we no longer have get deleted from them
    // (the global scope always, guilds once we've synced them)
    const scopes = new Set<string>([LOCAL_GUILD_ID, ...this._syncedScopes, ...this.commandsById.keys()]);
    for (let guildId of scopes) {
      this._syncedScopes.add(guildId);
      const guildIdOrUndefined = (guildId === LOCAL_GUILD_ID) ? undefined : guildId;

      let commands: BaseCollection<string, ApplicationCommand>;
      if (force) {
        commands = await this.uploadApplicationCommands(guildIdOrUndefined);
      } else {
        const remoteCommands = await this.fetchApplicationCommands(guildIdOrUndefined);
        this.fillCommandIds(remoteCommands, guildIdOrUndefined);
        const plan = this.planApplicationCommands(remoteCommands, guildIdOrUndefined);
        if (!plan.changes || !this.canUpload) {
          continue;
        }
        commands = await this.applyApplicationCommandsPlan(remoteCommands, plan, guildIdOrUndefined);
      }
      this.validateCommands(commands, guildIdOrUndefined);
      if (this.manager && this.manager.hasMultipleClusters) {
        this.manager.sendIPC(ClusterIPCOpCodes.FILL_INTERACTION_COMMANDS, {data: commands});
      }
    }
  }

  // applies the plan with the fewest requests, a bulk overwrite is one request no matter how many commands changed
  async applyApplicationCommandsPlan(
    commands: BaseCollection<string, ApplicationCommand>,
    plan: ApplicationCommandsPlan,
    guildId?: string,
  ): Promise<BaseCollection<string, ApplicationCommand>> {
    if (plan.changes !== 1) {
      return this.uploadApplicationCommands(guildId);
    }
    if (!this.client.ran) {
      throw new Error('Client hasn\'t ran yet so we don\'t know our application id!');
    }

    const shard = (this.client instanceof ClusterClient) ? this.client.shards.first()! : this.client;
    const applicationId = this.client.applicationId;
    const collection = commands.clone();
    if (plan.create.length) {
      const data = this.createApplicationCommandPayload(plan.create[0]) as any;
      const raw = (guildId) ?
        await shard.rest.createApplicationGuildCommand(applicationId, guildId, data) :
        await shard.rest.createApplicationCommand(applicationId, data);
      const command = new ApplicationCommand(shard, raw);
      collection.set(command.id, command);
    } else if (plan.delete.length) {
      const command = plan.delete[0];
      if (guildId) {
        await shard.rest.deleteApplicationGuildCommand(applicationId, guildId, command.id);
      } else {
        await shard.rest.deleteApplicationCommand(applicationId, command.id);
      }
      collection.delete(command.id);
    } else {
      const { local, remote } = plan.edit[0];
      const data = this.createApplicationCommandPayload(local) as any;
      const command = (guildId) ?
        await shard.rest.editApplicationGuildCommand(applicationId, guildId, remote.id, data) :
        await shard.rest.editApplicationCommand(applicationId, remote.id, data);
      collection.set(command.id, command);
    }
    return collection;
  }

  createApplicationCommandPayload(command: InteractionCommand): {toJSON: () => object} {
    const data = command.toJSON();
    (data as any)[DiscordKeys.IDS] = undefined;
    return {toJSON: () => data};
  }

  createApplicationCommandsFromRaw(data: Array<any>): BaseCollection<string, ApplicationCommand> {
    const collection = new BaseCollection<string, ApplicationCommand>();

    const shard = (this.client instanceof ClusterClient) ? this.client.shards.first()! : this.client;
    for (let raw of data) {
      const command = new ApplicationCommand(shard, raw);
      collection.set(command.id, command);
    }
    return collection;
  }

  async fetchApplicationCommands(guildId?: string): Promise<BaseCollection<string, ApplicationCommand>> {
    if (!this.client.ran) {
      throw new Error('Client hasn\'t ran yet so we don\'t know our application id!');
    }
    // include localizations so they can be compared against our local commands
    const options = {withLocalizations: true};

    let data: Array<any>;
    if (this.manager && this.manager.hasMultipleClusters) {
      if (guildId) {
        data = await this.manager.sendRestRequest('fetchApplicationGuildCommands', [this.client.applicationId, guildId, options]);
      } else {
        data = await this.manager.sendRestRequest('fetchApplicationCommands', [this.client.applicationId, options]);
      }
    } else {
      // the shard client's rest wraps the responses into structures, we want the raw data
      const rest = (this.client instanceof ClusterClient) ? this.client.rest : this.client.rest.raw;
      if (guildId) {
        data = await rest.fetchApplicationGuildCommands(this.client.applicationId, guildId, options);
      } else {
        data = await rest.fetchApplicationCommands(this.client.applicationId, options);
      }
    }
    return this.createApplicationCommandsFromRaw(data);
  }

  async uploadApplicationCommands(guildId?: string): Promise<BaseCollection<string, ApplicationCommand>> {
    if (!this.client.ran) {
      throw new Error('Client hasn\'t ran yet so we don\'t know our application id!');
    }
    const localCommands = (this.commandsById.get(guildId || LOCAL_GUILD_ID) || []).map((command: InteractionCommand) => {
      const payload = this.createApplicationCommandPayload(command);
      (payload.toJSON() as any)[DiscordKeys.ID] = command.ids.get(guildId || LOCAL_GUILD_ID);
      return payload;
    });

    const shard = (this.client instanceof ClusterClient) ? this.client.shards.first()! : this.client;
    if (guildId) {
      return shard.rest.bulkOverwriteApplicationGuildCommands(this.client.applicationId, guildId, localCommands);
    } else {
      return shard.rest.bulkOverwriteApplicationCommands(this.client.applicationId, localCommands);
    }
  }

  // stores the ids discord gave our local commands
  fillCommandIds(commands: BaseCollection<string, ApplicationCommand>, guildId?: string): void {
    const localCommands = this.commandsById.get(guildId || LOCAL_GUILD_ID);
    if (!localCommands) {
      return;
    }
    for (let [commandId, command] of commands) {
      const localCommand = localCommands.find((cmd) => cmd.name === command.name && cmd.type === command.type);
      if (localCommand) {
        localCommand.ids.set(guildId || LOCAL_GUILD_ID, command.id);
        this._commandIndex.delete(guildId || LOCAL_GUILD_ID);
        if (localCommand.integrationTypes === undefined) {
          localCommand.integrationTypes = command.integrationTypes;
        }
      }
    }
  }

  // returns what has to change on discord for it to match our local commands
  planApplicationCommands(commands: BaseCollection<string, ApplicationCommand>, guildId?: string): ApplicationCommandsPlan {
    const plan: ApplicationCommandsPlan = {changes: 0, create: [], delete: [], edit: []};

    const localCommands = this.commandsById.get(guildId || LOCAL_GUILD_ID);
    const matched = new Set<InteractionCommand>();
    for (let [commandId, command] of commands) {
      const localCommand = localCommands && localCommands.find((cmd) => {
        return !matched.has(cmd) && cmd.name === command.name && cmd.type === command.type;
      });
      if (localCommand) {
        matched.add(localCommand);
        const differences = diffApplicationCommands(localCommand, command, {isGuild: !!guildId});
        if (differences.length) {
          plan.edit.push({differences, local: localCommand, remote: command});
        }
      } else {
        plan.delete.push(command);
      }
    }
    if (localCommands) {
      for (let localCommand of localCommands) {
        if (!matched.has(localCommand)) {
          plan.create.push(localCommand);
        }
      }
    }
    plan.changes = plan.create.length + plan.delete.length + plan.edit.length;
    return plan;
  }

  // returns if the commands from discord matches our local state
  validateCommands(commands: BaseCollection<string, ApplicationCommand>, guildId?: string): boolean {
    if (!commands.length) {
      return false;
    }
    if (guildId === undefined) {
      guildId = commands.first()!.guildId;
    }
    if (!this.commandsById.has(guildId || LOCAL_GUILD_ID)) {
      return false;
    }
    this.fillCommandIds(commands, guildId);
    return !this.planApplicationCommands(commands, guildId).changes;
  }

  validateCommandsFromRaw(data: Array<any>): boolean {
    const collection = this.createApplicationCommandsFromRaw(data);
    return this.validateCommands(collection);
  }
  /* end */

  async parseArgs(context: InteractionContext, data: InteractionDataApplicationCommand): Promise<[ParsedArgs, ParsedErrors | null]> {
    if (data.isSlashCommand) {
      return this.parseArgsFromOptions(context, context.command._options, data.options, data.resolved);
    } else if (data.isContextCommand) {
      return this.parseArgsFromContextMenu(data);
    }
    return [{}, null];
  }

  async parseArgsFromContextMenu(data: InteractionDataApplicationCommand): Promise<[ParsedArgs, null]> {
    const args: ParsedArgs = {};
    if (data.targetId && data.resolved) {
      switch (data.type) {
        case ApplicationCommandTypes.MESSAGE: {
          if (data.resolved.messages) {
            args.message = data.resolved.messages.get(data.targetId);
          }
        }; break;
        case ApplicationCommandTypes.USER: {
          if (data.resolved.members) {
            args.member = data.resolved.members.get(data.targetId)!;
          }
          if (data.resolved.users) {
            args.user = data.resolved.users.get(data.targetId);
          }
        }; break;
      }
    }
    return [args, null];
  }

  async parseArgsFromOptions(
    context: InteractionContext,
    commandOptions?: BaseCollection<string, InteractionCommandOption>,
    options?: BaseCollection<string, InteractionDataApplicationCommandOption>,
    resolved?: InteractionDataApplicationCommandResolved,
  ): Promise<[ParsedArgs, ParsedErrors | null]> {
    const args: ParsedArgs = {};
    const errors: ParsedErrors = {};

    /*
      We will get data like this
      {
        id: '',
        name: '',
        options: [
          {
            name: '',
            options: [
              {
                name: '',
                options: [
                  {name: '', type: int, value: any},
                ],
                type: 1,
              }
            ],
            type: 2,
          },
        ],
        type: 1,
      }
      {
        id: '',
        name: '',
        options: [
          {
            name: '',
            options: [
              {
                name: '',
                type: 1,
              }
            ],
            type: 2,
          },
        ],
        type: 1,
      }
      {
        id: '',
        name: '',
        type: 1,
      }
      Non-required options wont be there so we must look through our command and fill out the defaults
    */

    let hasError = false;
    if (options) {
      for (let [name, option] of options) {
        let commandOption: InteractionCommandOption | undefined;
        if (commandOptions && commandOptions.has(name)) {
          commandOption = commandOptions.get(name)!;
        }

        if (option.options) {
          const [ childArgs, childErrors ] = await this.parseArgsFromOptions(context, commandOption && commandOption._options, option.options, resolved);
          Object.assign(args, childArgs);
          if (childErrors) {
            hasError = true;
            Object.assign(errors, childErrors);
          }
        } else if (option.value !== undefined) {
          let value: any = option.value;
          // primitives are converted whether or not `resolved` exists, so the type of a value doesn't depend on other options
          switch (option.type) {
            case ApplicationCommandOptionTypes.BOOLEAN: value = Boolean(value); break;
            // discord integers are within +-2^53 and numbers are doubles, both fit in a js number
            case ApplicationCommandOptionTypes.INTEGER: value = parseInt(value); break;
            case ApplicationCommandOptionTypes.NUMBER: value = Number(value); break;
          }
          if (resolved) {
            switch (option.type) {
              case ApplicationCommandOptionTypes.ATTACHMENT: {
                if (resolved.attachments) {
                  value = resolved.attachments.get(value) || value;
                }
              }; break;
              case ApplicationCommandOptionTypes.CHANNEL: {
                if (resolved.channels) {
                  value = resolved.channels.get(value) || value;
                }
              }; break;
              case ApplicationCommandOptionTypes.MENTIONABLE: {
                if (resolved.roles && resolved.roles.has(value)) {
                  value = resolved.roles.get(value);
                } else if (resolved.members && resolved.members.has(value)) {
                  value = resolved.members.get(value);
                } else if (resolved.users && resolved.users.has(value)) {
                  value = resolved.users.get(value);
                }
              }; break;
              case ApplicationCommandOptionTypes.ROLE: {
                if (resolved.roles) {
                  value = resolved.roles.get(value) || value;
                }
              }; break;
              case ApplicationCommandOptionTypes.USER: {
                // a non-member user (or one without member data) is only in `users`
                if (resolved.members && resolved.members.has(value)) {
                  value = resolved.members.get(value);
                } else if (resolved.users && resolved.users.has(value)) {
                  value = resolved.users.get(value);
                }
              }; break;
            }
          }

          const label = (commandOption) ? commandOption.label || name : name;
          if (commandOption) {
            if (commandOption.value && typeof(commandOption.value) === 'function') {
              try {
                args[label] = await Promise.resolve(commandOption.value(value, context));
              } catch(error: any) {
                hasError = true;
                errors[label] = error;
              }
            } else {
              args[label] = value;
            }
          } else {
            args[label] = value;
          }
        } else if (commandOption && commandOption._options) {
          hasError = (await this.parseDefaultArgsFromOptions(context, commandOption._options, args, errors)) || hasError;
        }
      }
    }

    if (commandOptions) {
      hasError = (await this.parseDefaultArgsFromOptions(context, commandOptions, args, errors)) || hasError;
    }

    return [args, (hasError) ? errors : null];
  }

  async parseDefaultArgsFromOptions(
    context: InteractionContext,
    commandOptions: BaseCollection<string, InteractionCommandOption>,
    args: ParsedArgs = {},
    errors: ParsedErrors = {},
  ): Promise<boolean> {
    let hasError = false;
    for (let [name, commandOption] of commandOptions) {
      if (commandOption.isSubCommand || commandOption.isSubCommandGroup) {
        continue;
      }

      const label = commandOption.label || name;
      if (commandOption.default !== undefined && !(label in args) && !(label in errors)) {
        if (typeof(commandOption.default) === 'function') {
          try {
            args[label] = await Promise.resolve(commandOption.default(context));
          } catch(error: any) {
            hasError = true;
            errors[label] = error;
          }
        } else {
          args[label] = commandOption.default;
        }
      }
    }
    return hasError;
  }

  setSubscriptions(): void {
    this.clearSubscriptions();

    const subscriptions = this._clientSubscriptions;
    subscriptions.push(this.client.subscribe(ClientEvents.INTERACTION_CREATE, this.handleInteractionCreate.bind(this)));
  }

  /* Kill/Run */
  kill(): void {
    this.client.kill();
    this.emit(ClientEvents.KILLED);
    this.clearSubscriptions();
    this.removeAllListeners();
  }

  async run(
    options: InteractionCommandClientRunOptions = {},
  ): Promise<ClusterClient | ShardClient> {
    if (this.ran) {
      return this.client;
    }
    if (options.directories) {
      for (let directory of options.directories) {
        await this.addMultipleIn(directory);
      }
    }
    await this.client.run(options);
    if (this.checkCommands) {
      await this.checkAndUploadCommands();
    }
    Object.defineProperty(this, 'ran', {value: true});
    return this.client;
  }

  async handleInteractionCreate(event: GatewayClientEvents.InteractionCreate) {
    const { interaction } = event;
    switch (interaction.type) {
      case InteractionTypes.APPLICATION_COMMAND: {
        return this.handleApplicationCommand(event);
      };
      case InteractionTypes.APPLICATION_COMMAND_AUTOCOMPLETE: {
        return this.handleApplicationCommandAutoComplete(event);
      };
    }
  }

  findCommand(
    data: InteractionDataApplicationCommand,
    interactionGuildId?: string | null,
  ): InteractionCommand | undefined {
    const guildIds = (interactionGuildId) ? [interactionGuildId, LOCAL_GUILD_ID] : [LOCAL_GUILD_ID];
    for (let guildId of guildIds) {
      const index = this.getCommandIndex(guildId);
      if (!index) {
        continue;
      }
      const nameKey = `${data.type}.${data.name}`;
      let command: InteractionCommand | undefined;
      if (this.strictCommandCheck) {
        command = index.byId.get(data.id);
        if (!command) {
          // ids are only known after the commands were checked (`checkCommands: false` never fills them)
          // so match commands without a known id by name, type and scope instead of ignoring them
          const isScopeMatch = (guildId === LOCAL_GUILD_ID) ? !data.guildId : data.guildId === guildId;
          if (isScopeMatch) {
            command = index.byNameWithoutId.get(nameKey);
          }
        }
      } else {
        command = index.byName.get(nameKey);
      }
      if (command) {
        return command;
      }
    }
    return undefined;
  }

  getCommandIndex(guildId: string): InteractionCommandIndex | null {
    let index = this._commandIndex.get(guildId);
    if (!index) {
      const localCommands = this.commandsById.get(guildId);
      if (!localCommands) {
        return null;
      }
      index = {byId: new Map(), byName: new Map(), byNameWithoutId: new Map()};
      // first one wins, same as the `.find()` this replaces
      for (let command of localCommands) {
        const commandId = command.ids.get(guildId);
        const nameKey = `${command.type}.${command.name}`;
        if (commandId) {
          if (!index.byId.has(commandId)) {
            index.byId.set(commandId, command);
          }
        } else if (!index.byNameWithoutId.has(nameKey)) {
          index.byNameWithoutId.set(nameKey, command);
        }
        if (!index.byName.has(nameKey)) {
          index.byName.set(nameKey, command);
        }
      }
      this._commandIndex.set(guildId, index);
    }
    return index;
  }

  async handleApplicationCommand(event: GatewayClientEvents.InteractionCreate): Promise<void> {
    const { interaction } = event;

    // assume the interaction is global for now
    const data = interaction.data as InteractionDataApplicationCommand;

    const command = this.findCommand(data, interaction.guildId);
    if (!command) {
      return;
    }

    const invoker = command.getInvoker(data);
    if (!invoker) {
      return;
    }

    const context = new InteractionContext(this, interaction, command, invoker);
    try {
      await this.handleApplicationCommandContext(context, data);
    } finally {
      // early returns (value errors, onBeforeRun cancels) skip the stop around `run`
      if (context.loadingTimeout) {
        context.loadingTimeout.stop();
      }
      if (typeof(invoker.onFinally) === 'function') {
        try {
          await Promise.resolve(invoker.onFinally(context));
        } catch(error: any) {
          const payload: InteractionCommandEvents.CommandError = {command, context, error};
          this.emit(ClientEvents.COMMAND_ERROR, payload);
        }
      }
    }
  }

  async handleApplicationCommandContext(
    context: InteractionContext,
    data: InteractionDataApplicationCommand,
  ): Promise<void> {
    const { command, invoker } = context;
    if (typeof(this.onInteractionCheck) === 'function') {
      try {
        const shouldContinue = await Promise.resolve(this.onInteractionCheck(context));
        if (!shouldContinue) {
          if (typeof(this.onInteractionCancel) === 'function') {
            await Promise.resolve(this.onInteractionCancel(context));
            return;
          }
          return;
        }
      } catch(error: any) {
        const payload: InteractionCommandEvents.CommandError = {command, context, error};
        this.emit(ClientEvents.COMMAND_ERROR, payload);
        return;
      }
    }

    if (typeof(this.onCommandCheck) === 'function') {
      try {
        const shouldContinue = await Promise.resolve(this.onCommandCheck(context, command));
        if (!shouldContinue) {
          if (typeof(this.onCommandCancel) === 'function') {
            await Promise.resolve(this.onCommandCancel(context, command));
            return;
          }
          return;
        }
      } catch(error: any) {
        const payload: InteractionCommandEvents.CommandError = {command, context, error};
        this.emit(ClientEvents.COMMAND_ERROR, payload);
        return;
      }
    }

    if (context.inDm) {
      if (invoker.disableDm) {
        if (typeof(invoker.onDmBlocked) === 'function') {
          try {
            await Promise.resolve(invoker.onDmBlocked(context));
          } catch(error: any) {
            const payload: InteractionCommandEvents.CommandError = {command, context, error};
            this.emit(ClientEvents.COMMAND_ERROR, payload);
          }
        } else {
          const error = new Error('Command with DMs disabled used in DM');
          const payload: InteractionCommandEvents.CommandError = {command, context, error};
          this.emit(ClientEvents.COMMAND_ERROR, payload);
        }
        return;
      }
    } else {
      // check the bot's permissions in the server
      // should never be ignored since it's most likely the bot will rely on this permission to do whatever action
      if (Array.isArray(invoker.permissionsClient) && invoker.permissionsClient.length) {
        const failed = [];

        const channel = context.channel;
        const member = context.me;
        if (channel && member) {
          const total = member.permissionsIn(channel);
          if (!member.isOwner && !PermissionTools.checkPermissions(total, Permissions.ADMINISTRATOR)) {
            for (let permission of invoker.permissionsClient) {
              if (!PermissionTools.checkPermissions(total, permission)) {
                failed.push(permission);
              }
            }
          }
        } else {
          for (let permission of invoker.permissionsClient) {
            failed.push(permission);
          }
        }

        if (failed.length) {
          const payload: InteractionCommandEvents.CommandPermissionsFailClient = {command, context, permissions: failed};
          this.emit(ClientEvents.COMMAND_PERMISSIONS_FAIL_CLIENT, payload);
          if (typeof(invoker.onPermissionsFailClient) === 'function') {
            try {
              await Promise.resolve(invoker.onPermissionsFailClient(context, failed));
            } catch(error) {
            }
          }
          return;
        }
      }

      // if command doesn't specify it should ignore the client owner, or if the user isn't a client owner
      // continue to permission checking
      if (!invoker.permissionsIgnoreClientOwner || !context.user.isClientOwner) {
        // check the user's permissions
        if (Array.isArray(invoker.permissions) && invoker.permissions.length) {
          const failed = [];

          const channel = context.channel;
          const member = context.member;
          if (channel && member) {
            const total = member.permissionsIn(channel);
            if (!member.isOwner && !PermissionTools.checkPermissions(total, Permissions.ADMINISTRATOR)) {
              for (let permission of invoker.permissions) {
                if (!PermissionTools.checkPermissions(total, permission)) {
                  failed.push(permission);
                }
              }
            }
          } else {
            for (let permission of invoker.permissions) {
              failed.push(permission);
            }
          }

          if (failed.length) {
            const payload: InteractionCommandEvents.CommandPermissionsFail = {command, context, permissions: failed};
            this.emit(ClientEvents.COMMAND_PERMISSIONS_FAIL, payload);
            if (typeof(invoker.onPermissionsFail) === 'function') {
              try {
                await Promise.resolve(invoker.onPermissionsFail(context, failed));
              } catch(error) {
              }
            }
            return;
          }
        }
      }
    }

    if (this.ratelimits.length || (invoker.ratelimits && invoker.ratelimits.length)) {
      const now = Date.now();
      {
        const ratelimits = this.ratelimiter.getExceeded(context, this.ratelimits, now);
        if (ratelimits.length) {
          const global = true;

          const payload: InteractionCommandEvents.CommandRatelimit = {command, context, global, ratelimits, now};
          this.emit(ClientEvents.COMMAND_RATELIMIT, payload);

          if (typeof(invoker.onRatelimit) === 'function') {
            try {
              await Promise.resolve(invoker.onRatelimit(context, ratelimits, {global, now}));
            } catch(error) {
            }
          }
          return;
        }
      }

      if (invoker.ratelimits && invoker.ratelimits.length) {
        const ratelimits = this.ratelimiter.getExceeded(context, invoker.ratelimits, now);
        if (ratelimits.length) {
          const global = false;

          const payload: InteractionCommandEvents.CommandRatelimit = {command, context, global, ratelimits, now};
          this.emit(ClientEvents.COMMAND_RATELIMIT, payload);

          if (typeof(invoker.onRatelimit) === 'function') {
            try {
              await Promise.resolve(invoker.onRatelimit(context, ratelimits, {global, now}));
            } catch(error) {
            }
          }
          return;
        }
      }
    }

    if (typeof(invoker.onBefore) === 'function') {
      try {
        const shouldContinue = await Promise.resolve(invoker.onBefore(context));
        if (!shouldContinue) {
          if (typeof(invoker.onCancel) === 'function') {
            await Promise.resolve(invoker.onCancel(context));
          }
          return;
        }
      } catch(error: any) {
        const payload: InteractionCommandEvents.CommandError = {command, context, error};
        this.emit(ClientEvents.COMMAND_ERROR, payload);
        return;
      }
    }
  
    let timeout: Timers.Timeout | null = null;
    try {
      const shouldTriggerLoading = invoker.triggerLoadingAfter !== undefined && 0 <= invoker.triggerLoadingAfter;
      if (shouldTriggerLoading && context._responding) {
        await context._responding;
      }

      if (shouldTriggerLoading && !context.responded) {
        let data: RequestTypes.CreateInteractionResponseInnerPayload | undefined;
        if (invoker.triggerLoadingAsEphemeral) {
          data = {flags: MessageFlags.EPHEMERAL};
        }
        if (invoker.triggerLoadingAfter) {
          timeout = new Timers.Timeout();
          Object.defineProperty(context, 'loadingTimeout', {value: timeout});
          timeout.start(invoker.triggerLoadingAfter, async () => {
            if (context._responding) {
              await context._responding;
            }
            if (context.responded) {
              return;
            }

            try {
              if (typeof(invoker.onLoadingTrigger) === 'function') {
                await Promise.resolve(invoker.onLoadingTrigger(context));
              } else {
                await context.respond(InteractionCallbackTypes.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE, data);
              }
            } catch(error) {
            }
          });
        } else {
          if (typeof(invoker.onLoadingTrigger) === 'function') {
            await Promise.resolve(invoker.onLoadingTrigger(context));
          } else {
            await context.respond(InteractionCallbackTypes.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE, data);
          }
        }
      }
    } catch(error) {
      // 404 interaction unknown most likely, do nothing
    }

    let args: ParsedArgs = {};
    try {
      // inside the try so a parsing failure goes through `onError`/COMMAND_FAIL instead of rejecting unhandled
      let errors: ParsedErrors | null;
      [args, errors] = await this.parseArgs(context, data);
      if (errors) {
        if (typeof(invoker.onValueError) === 'function') {
          try {
            await Promise.resolve(invoker.onValueError(context, args, errors));
          } catch(error: any) {
            const payload: InteractionCommandEvents.CommandError = {command, context, error, extra: errors};
            this.emit(ClientEvents.COMMAND_ERROR, payload);
          }
        }

        const error = new Error('Command errored out while converting args');
        const payload: InteractionCommandEvents.CommandError = {command, context, error, extra: errors};
        this.emit(ClientEvents.COMMAND_ERROR, payload);
        return;
      }

      if (typeof(invoker.onBeforeRun) === 'function') {
        const shouldRun = await Promise.resolve(invoker.onBeforeRun(context, args));
        if (!shouldRun) {
          if (typeof(invoker.onCancelRun) === 'function') {
            await Promise.resolve(invoker.onCancelRun(context, args));
          }
          return;
        }
      }

      try {
        if (typeof(invoker.run) === 'function') {
          await Promise.resolve(invoker.run(context, args));
        }

        if (timeout) {
          timeout.stop();
        }
      } catch(error: any) {
        if (timeout) {
          timeout.stop();
        }

        const payload: InteractionCommandEvents.CommandRunError = {args, command, context, error};
        this.emit(ClientEvents.COMMAND_RUN_ERROR, payload);
        if (typeof(invoker.onRunError) === 'function') {
          try {
            await Promise.resolve(invoker.onRunError(context, args, error));
          } catch(e: any) {
            const payload: InteractionCommandEvents.CommandError = {command, context, error: e};
            this.emit(ClientEvents.COMMAND_ERROR, payload);
          }
        }
        return;
      }

      const payload: InteractionCommandEvents.CommandRan = {args, command, context};
      this.emit(ClientEvents.COMMAND_RAN, payload);
      if (typeof(invoker.onSuccess) === 'function') {
        await Promise.resolve(invoker.onSuccess(context, args));
      }

    } catch(error: any) {
      if (typeof(invoker.onError) === 'function') {
        try {
          await Promise.resolve(invoker.onError(context, args, error));
        } catch(e: any) {
          const payload: InteractionCommandEvents.CommandError = {command, context, error: e};
          this.emit(ClientEvents.COMMAND_ERROR, payload);
        }
      }
      const payload: InteractionCommandEvents.CommandFail = {args, command, context, error};
      this.emit(ClientEvents.COMMAND_FAIL, payload);
    }
  }

  async handleApplicationCommandAutoComplete(event: GatewayClientEvents.InteractionCreate): Promise<void> {
    const { interaction } = event;
    const data = interaction.data as InteractionDataApplicationCommand;

    const command = this.findCommand(data, interaction.guildId);
    if (!command) {
      return;
    }

    const invoker = command.getInvokerForAutoComplete(data);
    if (!invoker) {
      return;
    }

    const context = new InteractionAutoCompleteContext(this, interaction, command, invoker);
    if (typeof(invoker.onAutoComplete) === 'function') {
      try {
        await Promise.resolve(invoker.onAutoComplete(context));
      } catch(error: any) {
        if (typeof(invoker.onAutoCompleteError) === 'function') {
          try {
            await Promise.resolve(invoker.onAutoCompleteError(context, error));
          } catch(e: any) {
            const payload: InteractionCommandEvents.CommandError = {command, context: context as any, error: e};
            this.emit(ClientEvents.COMMAND_ERROR, payload);
          }
        }
      }
    }
  }

  on(event: string | symbol, listener: (...args: any[]) => void): this;
  on(event: ClientEvents.COMMAND_ERROR, listener: (payload: InteractionCommandEvents.CommandError) => any): this;
  on(event: 'commandError', listener: (payload: InteractionCommandEvents.CommandError) => any): this;
  on(event: ClientEvents.COMMAND_FAIL, listener: (payload: InteractionCommandEvents.CommandFail) => any): this;
  on(event: 'commandFail', listener: (payload: InteractionCommandEvents.CommandFail) => any): this;
  on(event: ClientEvents.COMMAND_PERMISSIONS_FAIL_CLIENT, listener: (payload: InteractionCommandEvents.CommandPermissionsFailClient) => any): this;
  on(event: 'commandPermissionsFailClient', listener: (payload: InteractionCommandEvents.CommandPermissionsFailClient) => any): this;
  on(event: ClientEvents.COMMAND_PERMISSIONS_FAIL, listener: (payload: InteractionCommandEvents.CommandPermissionsFail) => any): this;
  on(event: 'commandPermissionsFail', listener: (payload: InteractionCommandEvents.CommandPermissionsFail) => any): this;
  on(event: ClientEvents.COMMAND_RAN, listener: (payload: InteractionCommandEvents.CommandRan) => any): this;
  on(event: 'commandRan', listener: (payload: InteractionCommandEvents.CommandRan) => any): this;
  on(event: ClientEvents.COMMAND_RATELIMIT, listener: (payload: InteractionCommandEvents.CommandRatelimit) => any): this;
  on(event: 'commandRatelimit', listener: (payload: InteractionCommandEvents.CommandRatelimit) => any): this;
  on(event: ClientEvents.COMMAND_RUN_ERROR, listener: (payload: InteractionCommandEvents.CommandRunError) => any): this;
  on(event: 'commandRunError', listener: (payload: InteractionCommandEvents.CommandRunError) => any): this;
  on(event: ClientEvents.KILLED, listener: () => any): this;
  on(event: string | symbol, listener: (...args: any[]) => void): this {
    super.on(event, listener);
    return this;
  }

  once(event: string | symbol, listener: (...args: any[]) => void): this;
  once(event: ClientEvents.COMMAND_ERROR, listener: (payload: InteractionCommandEvents.CommandError) => any): this;
  once(event: 'commandError', listener: (payload: InteractionCommandEvents.CommandError) => any): this;
  once(event: ClientEvents.COMMAND_FAIL, listener: (payload: InteractionCommandEvents.CommandFail) => any): this;
  once(event: 'commandFail', listener: (payload: InteractionCommandEvents.CommandFail) => any): this;
  once(event: ClientEvents.COMMAND_PERMISSIONS_FAIL_CLIENT, listener: (payload: InteractionCommandEvents.CommandPermissionsFailClient) => any): this;
  once(event: 'commandPermissionsFailClient', listener: (payload: InteractionCommandEvents.CommandPermissionsFailClient) => any): this;
  once(event: ClientEvents.COMMAND_PERMISSIONS_FAIL, listener: (payload: InteractionCommandEvents.CommandPermissionsFail) => any): this;
  once(event: 'commandPermissionsFail', listener: (payload: InteractionCommandEvents.CommandPermissionsFail) => any): this;
  once(event: ClientEvents.COMMAND_RAN, listener: (payload: InteractionCommandEvents.CommandRan) => any): this;
  once(event: 'commandRan', listener: (payload: InteractionCommandEvents.CommandRan) => any): this;
  once(event: ClientEvents.COMMAND_RATELIMIT, listener: (payload: InteractionCommandEvents.CommandRatelimit) => any): this;
  once(event: 'commandRatelimit', listener: (payload: InteractionCommandEvents.CommandRatelimit) => any): this;
  once(event: ClientEvents.COMMAND_RUN_ERROR, listener: (payload: InteractionCommandEvents.CommandRunError) => any): this;
  once(event: 'commandRunError', listener: (payload: InteractionCommandEvents.CommandRunError) => any): this;
  once(event: ClientEvents.KILLED, listener: () => any): this;
  once(event: string | symbol, listener: (...args: any[]) => void): this {
    super.once(event, listener);
    return this;
  }

  subscribe(event: string | symbol, listener: (...args: any[]) => void): EventSubscription;
  subscribe(event: ClientEvents.COMMAND_ERROR, listener: (payload: InteractionCommandEvents.CommandError) => any): EventSubscription;
  subscribe(event: 'commandError', listener: (payload: InteractionCommandEvents.CommandError) => any): EventSubscription;
  subscribe(event: ClientEvents.COMMAND_FAIL, listener: (payload: InteractionCommandEvents.CommandFail) => any): EventSubscription;
  subscribe(event: 'commandFail', listener: (payload: InteractionCommandEvents.CommandFail) => any): EventSubscription;
  subscribe(event: ClientEvents.COMMAND_PERMISSIONS_FAIL_CLIENT, listener: (payload: InteractionCommandEvents.CommandPermissionsFailClient) => any): EventSubscription;
  subscribe(event: 'commandPermissionsFailClient', listener: (payload: InteractionCommandEvents.CommandPermissionsFailClient) => any): EventSubscription;
  subscribe(event: ClientEvents.COMMAND_PERMISSIONS_FAIL, listener: (payload: InteractionCommandEvents.CommandPermissionsFail) => any): EventSubscription;
  subscribe(event: 'commandPermissionsFail', listener: (payload: InteractionCommandEvents.CommandPermissionsFail) => any): EventSubscription;
  subscribe(event: ClientEvents.COMMAND_RAN, listener: (payload: InteractionCommandEvents.CommandRan) => any): EventSubscription;
  subscribe(event: 'commandRan', listener: (payload: InteractionCommandEvents.CommandRan) => any): EventSubscription;
  subscribe(event: ClientEvents.COMMAND_RATELIMIT, listener: (payload: InteractionCommandEvents.CommandRatelimit) => any): EventSubscription;
  subscribe(event: 'commandRatelimit', listener: (payload: InteractionCommandEvents.CommandRatelimit) => any): EventSubscription;
  subscribe(event: ClientEvents.COMMAND_RUN_ERROR, listener: (payload: InteractionCommandEvents.CommandRunError) => any): EventSubscription;
  subscribe(event: 'commandRunError', listener: (payload: InteractionCommandEvents.CommandRunError) => any): EventSubscription;
  subscribe(event: ClientEvents.KILLED, listener: () => any): EventSubscription;
  subscribe(event: 'killed', listener: () => any): EventSubscription;
  subscribe(event: string | symbol, listener: (...args: any[]) => void): EventSubscription {
    return super.subscribe(event, listener);
  }
}
