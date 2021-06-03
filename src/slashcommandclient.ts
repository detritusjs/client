import * as path from 'path';

import { EventSpewer, EventSubscription, Timers } from 'detritus-utils';

import { ShardClient } from './client';
import {
  ClusterClient,
  ClusterClientOptions,
  ClusterClientRunOptions,
} from './clusterclient';
import { BaseCollection, BaseSet } from './collections';
import {
  ApplicationCommandOptionTypes,
  ClientEvents,
  InteractionTypes,
  Permissions,
  IS_TS_NODE,
} from './constants';
import { ImportedCommandsError } from './errors';
import { GatewayClientEvents } from './gateway/clientevents';
import {
  ApplicationCommand,
  InteractionDataApplicationCommand,
  InteractionDataApplicationCommandOption,
  InteractionDataApplicationCommandResolved,
} from './structures';
import { PermissionTools, getFiles } from './utils';

import {
  CommandCallbackRun,
  ParsedArgs,
  SlashCommand,
  SlashCommandEvents,
  SlashCommandOptions,
  SlashContext,
} from './slash';


export interface SlashCommandClientOptions extends ClusterClientOptions {
  activateOnEdits?: boolean,
  checkCommands?: boolean,
  ignoreMe?: boolean,
  maxEditDuration?: number,
  mentionsEnabled?: boolean,
  prefix?: string,
  prefixes?: Array<string>,
  prefixSpace?: boolean,
  useClusterClient?: boolean,
}

export interface SlashCommandClientAddOptions extends SlashCommandOptions {
  _class?: any,
}

export interface SlashCommandClientRunOptions extends ClusterClientRunOptions {

}


/**
 * Slash Command Client, hooks onto a ClusterClient or ShardClient to provide easier command handling
 * @category Clients
 */
export class SlashCommandClient extends EventSpewer {
  readonly _clientSubscriptions: Array<EventSubscription> = [];

  checkCommands: boolean = true;
  client: ClusterClient | ShardClient;
  commands = new BaseSet<SlashCommand>();
  commandsVerified: boolean = false;
  ran: boolean = false;

  constructor(
    token: ClusterClient | ShardClient | string,
    options: SlashCommandClientOptions = {},
  ) {
    super();
    options = Object.assign({useClusterClient: true}, options);

    this.checkCommands = (options.checkCommands || options.checkCommands === undefined);

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
    Object.defineProperty(this.client, 'slashCommandClient', {value: this});

    Object.defineProperties(this, {
      _clientSubscriptions: {enumerable: false, writable: false},
      client: {enumerable: false, writable: false},
      ran: {configurable: true, writable: false},
    });
  }

  get rest() {
    return this.client.rest;
  }

  /* Generic Command Function */
  add(
    options: SlashCommand | SlashCommandClientAddOptions,
    run?: CommandCallbackRun,
  ): this {
    let command: SlashCommand;
    if (options instanceof SlashCommand) {
      command = options;
    } else {
      if (run !== undefined) {
        options.run = run;
      }
      // create a normal command class with the options given
      if (options._class === undefined) {
        command = new SlashCommand(options);
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

    if (!command.hasRun) {
      throw new Error('Command needs a run function');
    }
    this.commands.add(command);

    this.setSubscriptions();
    return this;
  }

  addMultiple(commands: Array<SlashCommand | SlashCommandOptions> = []): this {
    for (let command of commands) {
      this.add(command);
    }
    return this;
  }

  async addMultipleIn(
    directory: string,
    options: {isAbsolute?: boolean, subdirectories?: boolean} = {},
  ): Promise<this> {
    options = Object.assign({}, options);
    if (!options.isAbsolute) {
      if (require.main) {
        // require.main.path exists but typescript doesn't let us use it..
        directory = path.join(path.dirname(require.main.filename), directory);
      }
    }

    const files: Array<string> = await getFiles(directory, options.subdirectories);
    const errors: Record<string, Error> = {};

    const addCommand = (imported: any, filepath: string): void => {
      if (!imported) {
        return;
      }
      if (typeof(imported) === 'function') {
        this.add({_file: filepath, _class: imported, name: ''});
      } else if (imported instanceof SlashCommand) {
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

  async checkApplicationCommands(): Promise<boolean> {
    if (!this.client.ran) {
      return this.commandsVerified = false;
    }
    if (this.commandsVerified) {
      return true;
    }
    const commands = await this.fetchApplicationCommands();
    for (let [commandId, command] of commands) {
      const localCommand = this.commands.find((cmd) => cmd.name === command.name);
      if (localCommand && localCommand.hash === command.hash) {
        localCommand.ids.add(command.id);
      }
    }
    for (let localCommand of this.commands) {
      if (!localCommand.ids.length) {
        return this.commandsVerified = false;
      }
    }
    return this.commandsVerified = true;
  }

  async checkAndUploadCommands(): Promise<void> {
    if (!await this.checkApplicationCommands()) {
      await this.uploadApplicationCommands();
    }
  }

  async fetchApplicationCommands(): Promise<BaseCollection<string, ApplicationCommand>> {
    // add ability for ClusterManager checks
    if (!this.client.ran) {
      throw new Error('Client hasn\'t ran yet so we don\'t know our application id!');
    }
    return this.rest.fetchApplicationCommands(this.client.applicationId);
  }

  async uploadApplicationCommands(): Promise<BaseCollection<string, ApplicationCommand>> {
    // add ability for ClusterManager
    if (!this.client.ran) {
      throw new Error('Client hasn\'t ran yet so we don\'t know our application id!');
    }
    return this.rest.bulkOverwriteApplicationCommands(this.client.applicationId, this.commands.map((command) => {
      return Object.assign(command.toJSON(), {id: command.ids.first()});
    }));
  }

  parseArgs(data: InteractionDataApplicationCommand): ParsedArgs {
    if (data.options) {
      return this.parseArgsFromOptions(data.options, data.resolved);
    }
    return {};
  }

  parseArgsFromOptions(
    options: BaseCollection<string, InteractionDataApplicationCommandOption>,
    resolved?: InteractionDataApplicationCommandResolved,
  ): ParsedArgs {
    const args: ParsedArgs = {};
    for (let [name, option] of options) {
      if (option.options) {
        Object.assign(args, this.parseArgsFromOptions(option.options, resolved));
      } else if (option.value !== undefined) {
        let value: any = option.value;
        if (resolved) {
          switch (option.type) {
            case ApplicationCommandOptionTypes.CHANNEL: {
              if (resolved.channels) {
                value = resolved.channels.get(value) || value;
              }
            }; break;
            case ApplicationCommandOptionTypes.BOOLEAN: value = Boolean(value); break;
            case ApplicationCommandOptionTypes.INTEGER: value = parseInt(value); break;
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
              if (resolved.members) {
                value = resolved.members.get(value) || value;
              } else if (resolved.users) {
                value = resolved.users.get(value) || value;
              }
            }; break;
          }
        }
        args[name] = value;
      }
    }
    return args;
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
    subscriptions.push(this.client.subscribe(ClientEvents.INTERACTION_CREATE, this.handleInteractionCreate.bind(this)));
  }

  /* Kill/Run */
  kill(): void {
    this.client.kill();
    this.emit(ClientEvents.KILLED);
    this.resetSubscriptions();
    this.removeAllListeners();
  }

  async run(
    options: SlashCommandClientRunOptions = {},
  ): Promise<ClusterClient | ShardClient> {
    if (this.ran) {
      return this.client;
    }
    await this.client.run(options);
    if (this.checkCommands) {
      await this.checkAndUploadCommands();
    }
    Object.defineProperty(this, 'ran', {value: true});
    return this.client;
  }

  async handleInteractionCreate(event: GatewayClientEvents.InteractionCreate) {
    return this.handle(ClientEvents.INTERACTION_CREATE, event);
  }

  async handle(name: ClientEvents.INTERACTION_CREATE, event: GatewayClientEvents.InteractionCreate): Promise<void> {
    const { interaction } = event;
    if (interaction.type !== InteractionTypes.APPLICATION_COMMAND) {
      return;
    }

    // assume the interaction is global for now
    const data = interaction.data as InteractionDataApplicationCommand;
    const command = this.commands.find((cmd) => cmd.name === data.name);
    if (!command) {
      return;
    }
    const invoker = command.getInvoker(data);
    if (!invoker) {
      return;
    }

    const context = new SlashContext(this, interaction, command, invoker);
    if (context.inDm) {
      // dm checks? maybe add ability to disable it in dm?
      if (invoker.disableDm) {
        const error = new Error('Command with DMs disabled used in DM');
        const payload: SlashCommandEvents.CommandError = {command, context, error};
        this.emit(ClientEvents.COMMAND_ERROR, payload);
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
          const payload: SlashCommandEvents.CommandPermissionsFailClient = {command, context, permissions: failed};
          this.emit(ClientEvents.COMMAND_PERMISSIONS_FAIL_CLIENT, payload);
          if (typeof(invoker.onPermissionsFailClient) === 'function') {
            try {
              await Promise.resolve(invoker.onPermissionsFailClient(context, failed));
            } catch(error) {
              // do something with this error?
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
            const payload: SlashCommandEvents.CommandPermissionsFail = {command, context, permissions: failed};
            this.emit(ClientEvents.COMMAND_PERMISSIONS_FAIL, payload);
            if (typeof(invoker.onPermissionsFail) === 'function') {
              try {
                await Promise.resolve(invoker.onPermissionsFail(context, failed));
              } catch(error) {
                // do something with this error?
              }
            }
            return;
          }
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
      } catch(error) {
        const payload: SlashCommandEvents.CommandError = {command, context, error};
        this.emit(ClientEvents.COMMAND_ERROR, payload);
        return;
      }
    }

    const args = this.parseArgs(data);
    try {
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

        const payload: SlashCommandEvents.CommandRan = {args, command, context};
        this.emit(ClientEvents.COMMAND_RAN, payload);
        if (typeof(invoker.onSuccess) === 'function') {
          await Promise.resolve(invoker.onSuccess(context, args));
        }
      } catch(error) {
        const payload: SlashCommandEvents.CommandRunError = {args, command, context, error};
        this.emit(ClientEvents.COMMAND_RUN_ERROR, payload);
        if (typeof(invoker.onRunError) === 'function') {
          await Promise.resolve(invoker.onRunError(context, args, error));
        }
      }
    } catch(error) {
      if (typeof(invoker.onError) === 'function') {
        await Promise.resolve(invoker.onError(context, args, error));
      }
      const payload: SlashCommandEvents.CommandFail = {args, command, context, error};
      this.emit(ClientEvents.COMMAND_FAIL, payload);
    }
  }

  on(event: string | symbol, listener: (...args: any[]) => void): this;
  on(event: ClientEvents.KILLED, listener: () => any): this;
  on(event: 'killed', listener: () => any): this;
  on(event: string | symbol, listener: (...args: any[]) => void): this {
    super.on(event, listener);
    return this;
  }

  once(event: string | symbol, listener: (...args: any[]) => void): this;
  once(event: ClientEvents.KILLED, listener: () => any): this;
  once(event: 'killed', listener: () => any): this;
  once(event: string | symbol, listener: (...args: any[]) => void): this {
    super.once(event, listener);
    return this;
  }

  subscribe(event: string | symbol, listener: (...args: any[]) => void): EventSubscription;
  subscribe(event: ClientEvents.KILLED, listener: () => any): EventSubscription;
  subscribe(event: 'killed', listener: () => any): EventSubscription;
  subscribe(event: string | symbol, listener: (...args: any[]) => void): EventSubscription {
    return super.subscribe(event, listener);
  }
}
