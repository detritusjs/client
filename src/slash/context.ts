import { RequestTypes } from 'detritus-client-rest';
import { Timers } from 'detritus-utils';

import { ShardClient } from '../client';
import { ClusterClient } from '../clusterclient';
import { ClusterProcessChild } from '../cluster/processchild';
import { SlashCommandClient } from '../slashcommandclient';

import { Interaction, InteractionDataApplicationCommand } from '../structures';

import { SlashCommand, SlashCommandOption } from './command';



/**
 * Slash Command Context
 * @category Command
 */
export class SlashContext {
  readonly client: ShardClient;
  readonly command: SlashCommand;
  readonly interaction: Interaction;
  readonly invoker: SlashCommand | SlashCommandOption;
  readonly slashCommandClient: SlashCommandClient;

  metadata?: Record<string, any>;

  constructor(
    slashCommandClient: SlashCommandClient,
    interaction: Interaction,
    command: SlashCommand,
    invoker: SlashCommand | SlashCommandOption,
  ) {
    this.command = command;
    this.interaction = interaction;
    this.slashCommandClient = slashCommandClient;
    this.invoker = invoker;

    this.client = interaction.client;
    Object.defineProperties(this, {
      client: {enumerable: false, writable: false},
      command: {enumerable: false, writable: false},
      interaction: {enumerable: false, writable: false},
      invoker: {enumerable: false, writable: false},
      slashCommandClient: {enumerable: false, writable: false},
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

  get data(): InteractionDataApplicationCommand {
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

  createMessage(options: RequestTypes.ExecuteWebhook | string = {}) {
    return this.rest.executeWebhook(this.applicationId, this.token, options);
  }

  deleteMessage(messageId: string) {
    return this.rest.deleteWebhookTokenMessage(this.applicationId, this.token, messageId);
  }

  deleteResponse() {
    return this.deleteMessage('@original');
  }

  editMessage(messageId: string, options: RequestTypes.EditWebhookTokenMessage = {}) {
    return this.rest.editWebhookTokenMessage(this.applicationId, this.token, messageId, options);
  }

  editResponse(options: RequestTypes.EditWebhookTokenMessage = {}) {
    return this.editMessage('@original', options);
  }

  fetchMessage(messageId: string) {
    return this.rest.fetchWebhookTokenMessage(this.applicationId, this.token, messageId);
  }

  fetchResponse() {
    return this.fetchMessage('@original');
  }

  respond(
    options: RequestTypes.CreateInteractionResponse | number,
    data?: RequestTypes.CreateInteractionResponseInnerPayload | string,
  ) {
    return this.rest.createInteractionResponse(this.id, this.token, options, data);
  }

  toJSON() {
    return this.interaction;
  }

  toString() {
    return `Slash Context (${this.interaction.id})`;
  }
}
