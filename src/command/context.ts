import { RequestTypes } from 'detritus-client-rest';

import { ShardClient } from '../client';
import { ClusterClient } from '../clusterclient';
import { ClusterProcessChild } from '../cluster/processchild';
import { CommandClient } from '../commandclient';

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

  get response() {
    return this.commandClient.replies.get(this.messageId);
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

  editOrReply(options: RequestTypes.EditMessage | string = {}) {
    const message = this.response;
    if (message) {
      if (typeof(options) === 'string') {
        options = {content: options, embed: null};
      } else {
        options = Object.assign({content: '', embed: null}, options);
      }
      return message.edit(options);
    }
    return this.message.reply(options);
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
