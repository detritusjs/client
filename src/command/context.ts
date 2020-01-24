import { RequestTypes } from 'detritus-client-rest';

import { ShardClient } from '../client';
import { ClusterClient } from '../clusterclient';
import { ClusterProcessChild } from '../cluster/processchild';
import { CommandClient, CommandReply } from '../commandclient';

import { Message, Typing } from '../structures';

import { Command } from './command';


/**
 * Command Context
 * @category Command
 */
export class Context {
  readonly client: ShardClient;
  readonly commandClient: CommandClient;
  readonly message: Message;
  readonly typing: Typing | null;

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

  get response(): Message | null {
    if (this.commandClient.replies.has(this.messageId)) {
      const { reply } = <CommandReply> this.commandClient.replies.get(this.messageId);
      return reply;
    }
    return null;
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

  get inDm() {
    return this.message.inDm;
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

  async editOrReply(options: RequestTypes.EditMessage | string = {}) {
    if (this.commandClient.replies.has(this.messageId)) {
      const old = <CommandReply> this.commandClient.replies.get(this.messageId);
      if (typeof(options) === 'string') {
        options = {content: options, embed: null};
      } else {
        options = Object.assign({content: '', embed: null}, options);
      }
      return old.reply.edit(options);
    } else {
      const reply = await this.message.reply(options);
      if (this.command) {
        this.commandClient.storeReply(this.messageId, this.command, this, reply);
      }
      return reply;
    }
  }

  reply(options: RequestTypes.CreateMessage | string = {}) {
    return this.message.reply(options);
  }

  triggerTyping() {
    return this.message.triggerTyping();
  }

  toJSON() {
    return this.message;
  }

  toString() {
    return `Context (${this.messageId})`;
  }
}
