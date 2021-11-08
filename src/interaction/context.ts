import { RequestTypes } from 'detritus-client-rest';
import { Timers } from 'detritus-utils';

import { ShardClient } from '../client';
import { ClusterClient } from '../clusterclient';
import { ClusterProcessChild } from '../cluster/processchild';
import { InteractionCallbackTypes } from '../constants';
import { InteractionCommandClient } from '../interactioncommandclient';

import {
  Interaction,
  InteractionDataApplicationCommand,
  InteractionEditOrRespond,
} from '../structures';

import { InteractionCommand, InteractionCommandOption } from './command';


export class InteractionContextBase {
  readonly client: ShardClient;
  readonly command: InteractionCommand;
  readonly interaction: Interaction;
  readonly invoker: InteractionCommand | InteractionCommandOption;
  readonly loadingTimeout?: Timers.Timeout;
  readonly interactionCommandClient: InteractionCommandClient;

  metadata?: Record<string, any>;

  constructor(
    interactionCommandClient: InteractionCommandClient,
    interaction: Interaction,
    command: InteractionCommand,
    invoker: InteractionCommand | InteractionCommandOption,
  ) {
    this.command = command;
    this.interaction = interaction;
    this.interactionCommandClient = interactionCommandClient;
    this.invoker = invoker;

    this.client = interaction.client;
    Object.defineProperties(this, {
      client: {enumerable: false, writable: false},
      command: {enumerable: false, writable: false},
      interaction: {enumerable: false, writable: false},
      invoker: {enumerable: false, writable: false},
      interactionCommandClient: {enumerable: false, writable: false},
    });
  }

  /* Generic Client Properties */
  get application() {
    return this.client.application;
  }

  get applicationId() {
    return this.client.applicationId;
  }

  get cluster(): ClusterClient | null {
    return this.client.cluster;
  }

  get commandClient() {
    return this.client.commandClient;
  }

  get gateway() {
    return this.client.gateway;
  }

  get manager(): ClusterProcessChild | null {
    return (this.cluster) ? this.cluster.manager : null;
  }

  get owners() {
    return this.client.owners;
  }

  get rest() {
    return this.client.rest;
  }

  get shardCount() {
    return this.client.shardCount;
  }

  get shardId() {
    return this.client.shardId;
  }

  /* Client Collections */
  get applications() {
    return this.client.applications;
  }

  get channels() {
    return this.client.channels;
  }

  get emojis() {
    return this.client.emojis;
  }

  get guilds() {
    return this.client.guilds;
  }

  get interactions() {
    return this.client.interactions;
  }

  get members() {
    return this.client.members;
  }

  get messages() {
    return this.client.messages;
  }

  get notes() {
    return this.client.notes;
  }

  get presences() {
    return this.client.presences;
  }

  get relationships() {
    return this.client.relationships;
  }

  get roles() {
    return this.client.roles;
  }

  get sessions() {
    return this.client.sessions;
  }

  get stageInstances() {
    return this.client.stageInstances;
  }

  get stickers() {
    return this.client.stickers;
  }

  get typings() {
    return this.client.typings;
  }

  get users() {
    return this.client.users;
  }

  get voiceCalls() {
    return this.client.voiceCalls;
  }

  get voiceConnections() {
    return this.client.voiceConnections;
  }

  get voiceStates() {
    return this.client.voiceStates;
  }

  /* Interaction Properties */
  get _responding() {
    return this.interaction._responding;
  }

  get data() {
    return this.interaction.data as InteractionDataApplicationCommand;
  }

  get channel() {
    return this.interaction.channel;
  }

  get channelId() {
    return this.interaction.channelId;
  }

  get guild() {
    return this.interaction.guild;
  }

  get guildId() {
    return this.interaction.guildId;
  }

  get id() {
    return this.interaction.id;
  }

  get inDm() {
    return this.interaction.inDm;
  }

  get interactionId() {
    return this.interaction.id;
  }

  get me() {
    const guild = this.guild;
    if (guild) {
      return guild.me;
    }
    return null;
  }

  get member() {
    return this.interaction.member;
  }

  get name() {
    return this.data.fullName;
  }

  get responded() {
    return this.interaction.responded;
  }

  get response() {
    return this.interaction.response;
  }

  get responseDeleted() {
    return this.interaction.responseDeleted;
  }

  get responseId() {
    return this.interaction.responseId;
  }

  get token() {
    return this.interaction.token;
  }

  get user() {
    return this.interaction.user;
  }

  get userId() {
    return this.interaction.userId;
  }

  get voiceChannel() {
    const member = this.member;
    if (member) {
      return member.voiceChannel;
    }
    return null;
  }

  get voiceConnection() {
    return this.voiceConnections.get(this.guildId || this.channelId || '');
  }

  get voiceState() {
    const member = this.member;
    if (member) {
      return member.voiceState;
    }
    return null;
  }

  toJSON() {
    return this.interaction.toJSON();
  }

  toString() {
    return `Interaction Context (${this.interaction.id})`;
  }
}


/**
 * Interaction Command Context
 * @category InteractionCommand
 */
export class InteractionContext extends InteractionContextBase {
  /* Interaction Data Properties */
  get options() {
    return this.data.options;
  }

  /* Functions */
  createMessage(options: RequestTypes.ExecuteWebhook | string = {}) {
    return this.interaction.createMessage(options);
  }

  createResponse(
    options: RequestTypes.CreateInteractionResponse | number,
    data?: RequestTypes.CreateInteractionResponseInnerPayload | string,
  ) {
    return this.interaction.createResponse(options, data);
  }

  deleteMessage(messageId: string) {
    return this.interaction.deleteMessage(messageId);
  }

  deleteResponse() {
    return this.interaction.deleteResponse();
  }

  editMessage(messageId: string, options: RequestTypes.EditWebhookTokenMessage = {}) {
    return this.interaction.editMessage(messageId, options);
  }

  editResponse(options: RequestTypes.EditWebhookTokenMessage = {}) {
    return this.interaction.editResponse(options);
  }

  editOrRespond(options: InteractionEditOrRespond | string = {}) {
    return this.interaction.editOrRespond(options);
  }

  fetchMessage(messageId: string) {
    return this.interaction.fetchMessage(messageId);
  }

  fetchResponse() {
    return this.interaction.fetchResponse();
  }

  respond(
    options: RequestTypes.CreateInteractionResponse | number,
    data?: RequestTypes.CreateInteractionResponseInnerPayload | string,
  ) {
    return this.createResponse(options, data);
  }
}


/**
 * Interaction Auto Complete Context
 * @category InteractionCommand
 */
export class InteractionAutoCompleteContext extends InteractionContextBase {
  get option() {
    for (let [name, option] of this.options) {
      if (option.options) {
        for (let [x, opt] of option.options) {
          if (opt.focused) {
            return opt;
          }
          if (opt.options) {
            for (let [_, o] of opt.options) {
              if (o.focused) {
                return o;
              }
            }
          }
        }
      }
      if (option.focused) {
        return option;
      }
    }
    return null;
  }

  get options() {
    return this.data.options!;
  }

  get value(): string {
    const option = this.option;
    return (option) ? ((option.value || '') as string) : '';
  }

  createResponse(
    data: RequestTypes.CreateInteractionResponseInnerPayload,
  ) {
    return this.interaction.createResponse(
      InteractionCallbackTypes.APPLICATION_COMMAND_AUTOCOMPLETE_RESULT,
      data,
    );
  }

  respond(
    data: RequestTypes.CreateInteractionResponseInnerPayload,
  ) {
    return this.createResponse(data);
  }
}
