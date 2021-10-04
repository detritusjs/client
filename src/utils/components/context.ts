import { RequestTypes } from 'detritus-client-rest';

import { ShardClient } from '../../client';
import { ClusterClient } from '../../clusterclient';
import { ClusterProcessChild } from '../../cluster/processchild';
import {
  Interaction,
  InteractionDataComponent,
  InteractionEditOrRespond,
  Message,
} from '../../structures';


export class ComponentContext {
  readonly client: ShardClient;
  readonly interaction: Interaction;

  constructor(interaction: Interaction) {
    this.interaction = interaction;

    this.client = interaction.client;
    Object.defineProperties(this, {
      client: {enumerable: false, writable: false},
      component: {enumerable: false, writable: false},
      interaction: {enumerable: false, writable: false},
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

  get interactionCommandClient() {
    return this.client.interactionCommandClient;
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
  get customId(): string {
    return this.data.customId;
  }

  get data(): InteractionDataComponent {
    return this.interaction.data as InteractionDataComponent;
  }

  get channel() {
    return this.interaction.channel;
  }

  get channelId(): string {
    return this.interaction.channelId!;
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

  get message(): Message {
    return this.interaction.message!;
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

  toJSON() {
    return this.interaction.toJSON();
  }

  toString() {
    return `Interaction Context (${this.interaction.id})`;
  }
}
