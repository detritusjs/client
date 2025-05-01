import { RequestTypes } from 'detritus-client-rest';
import { Timers } from 'detritus-utils';

import { ShardClient } from '../client';
import { ClusterClient } from '../clusterclient';
import { ClusterProcessChild } from '../cluster/processchild';
import { CommandClient, CommandReply } from '../commandclient';
import { MessageFlags, MAX_ATTACHMENT_SIZE } from '../constants';
import { Components } from '../utils';

import { Message, Typing, MessageReplyOptions } from '../structures';

import { Command } from './command';


export type EditOrCreate = RequestTypes.CreateMessage & RequestTypes.EditMessage & MessageReplyOptions;
export interface EditOrReply extends EditOrCreate {
  delete?: boolean,
}


/**
 * Command Context
 * @category Command
 */
export class Context {
  readonly client: ShardClient;
  readonly commandClient: CommandClient;
  readonly message: Message;
  readonly typing: Typing | null;
  readonly typingTimeout?: Timers.Timeout;

  command?: Command;
  metadata?: {[key: string]: any};
  prefix?: string;

  constructor(
    message: Message,
    typing: Typing | null,
    commandClient: CommandClient,
  ) {
    this.message = message;
    this.typing = typing;
    this.commandClient = commandClient;

    this.client = message.client;
    Object.defineProperties(this, {
      client: {enumerable: false, writable: false},
      command: {enumerable: false, writable: true},
      commandClient: {enumerable: false, writable: false},
      message: {writable: false},
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

  get interactionCommandClient() {
    return this.client.interactionCommandClient;
  }

  get response(): Message | null {
    if (this.commandClient.replies.has(this.messageId)) {
      const { reply } = this.commandClient.replies.get(this.messageId) as CommandReply;
      return reply;
    }
    return null;
  }

  /* Client Collections */
  get applicationCommandPermissions() {
    return this.client.applicationCommandPermissions;
  }

  get applicationEmojis() {
    return this.client.applicationEmojis;
  }

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

  get guildScheduledEvents() {
    return this.client.guildScheduledEvents;
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

  /* Message Properties */
  get canDelete() {
    return this.message.canDelete;
  }

  get canEdit() {
    return this.message.canEdit;
  }

  get canManage() {
    return this.message.canManage;
  }

  get canReact() {
    return this.message.canReact;
  }

  get canReply() {
    return this.message.canReply;
  }

  get channel() {
    return this.message.channel;
  }

  get channelId() {
    return this.message.channelId;
  }

  get content() {
    return this.message.content;
  }

  get fromBot() {
    return this.message.fromBot;
  }

  get fromSystem() {
    return this.message.fromSystem;
  }

  get fromUser() {
    return this.message.fromUser;
  }

  get fromWebhook() {
    return this.message.fromWebhook;
  }

  get guild() {
    return this.message.guild;
  }

  get guildId() {
    return this.message.guildId;
  }

  get hasServerPermissions() {
    return true;
  }

  get inDm() {
    return this.message.inDm;
  }

  get maxAttachmentSize(): number {
    const guild = this.guild;
    if (guild) {
      return guild.maxAttachmentSize;
    }
    return MAX_ATTACHMENT_SIZE;
  }

  get me() {
    const guild = this.guild;
    if (guild) {
      return guild.me;
    }
    return null;
  }

  get member() {
    return this.message.member;
  }

  get messageId() {
    return this.message.id;
  }

  get systemContent() {
    return this.message.systemContent;
  }

  get user() {
    return this.message.author;
  }

  get userId() {
    return this.message.author.id;
  }

  get voiceChannel() {
    const member = this.member;
    if (member) {
      return member.voiceChannel;
    }
    return null;
  }

  get voiceConnection() {
    return this.voiceConnections.get(this.guildId || this.channelId);
  }

  get voiceState() {
    const member = this.member;
    if (member) {
      return member.voiceState;
    }
    return null;
  }

  async editOrReply(options: EditOrReply | string = {}) {
    if (typeof(options) === 'string') {
      options = {content: options};
    }
    let reply: Message;
    if (this.commandClient.replies.has(this.messageId)) {
      options = Object.assign({attachments: [], components: [], content: '', embeds: []}, options);
      const old = this.commandClient.replies.get(this.messageId)!;

      let shouldReplyWithNew = !old.reply.canEdit || options.activity || options.applicationId;
      if (!shouldReplyWithNew) {
        // you can edit from non-components-v2 to components-v2, but not the other way around
        // must have empty embeds and content though if you do
        if (old.reply.hasFlagComponentsV2) {
          if (options.content || (options.embeds && options.embeds.length)) {
            shouldReplyWithNew = true;
          }
        } else {
          if (options.flags && (options.flags & MessageFlags.IS_COMPONENTS_V2)) {
            // set content and embeds to empty
            options.content = '';
            options.embeds = [];
          } else if (options.components instanceof Components) {
            if (options.components.isV2) {
              // set content and embeds to empty
              options.content = '';
              options.embeds = [];
            }
          } else {
            // convert options.components to Components object then use `.isV2`
          }
        }
      }

      if (shouldReplyWithNew) {
        // maybe add checks for flag IS_VOICE_MESSAGE since you cant edit that flag in
        if (options.delete || options.delete === undefined) {
          await old.reply.delete();
        }
        reply = await this.message.reply(options);
      } else {
        reply = await old.reply.edit(options);
      }
    } else {
      reply = await this.message.reply(options);
    }
    if (this.command) {
      this.commandClient.storeReply(this.messageId, this.command, this, reply);
    }
    return reply;
  }

  reply(options: RequestTypes.CreateMessage | string = {}) {
    return this.message.reply(options);
  }

  triggerTyping() {
    return this.message.triggerTyping();
  }

  toJSON() {
    return this.message.toJSON();
  }

  toString() {
    return `Context (${this.messageId})`;
  }
}
