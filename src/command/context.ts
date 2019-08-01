import { ShardClient } from '../client';
import { ClusterClient } from '../clusterclient';
import { ClusterProcessChild } from '../cluster/processchild';
import { CommandClient } from '../commandclient';

import {
  Message,
  MessageReply,
} from '../structures';


/**
 * Command Context
 * @category Command
 */
export class Context {
  readonly client: ShardClient;
  readonly commandClient: CommandClient;
  readonly message: Message;

  constructor(
    message: Message,
    commandClient: CommandClient,
  ) {
    this.message = message;
    this.commandClient = commandClient;
    this.client = message.client;
    Object.defineProperties(this, {
      client: {enumerable: false, writable: false},
      commandClient: {enumerable: false, writable: false},
      message: {writable: false},
    });
  }

  /* Generic Client Properties */

  get cluster(): ClusterClient | null {
    return this.client.cluster;
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

  get sessions() {
    return this.client.sessions;
  }

  get typing() {
    return this.client.typing;
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
  get channel() {
    return this.message.channel;
  }

  get channelId() {
    return this.message.channelId;
  }

  get content() {
    return this.message.content;
  }

  get contentFormatted() {
    return this.message.contentFormatted;
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

  get user() {
    return this.message.author;
  }

  get userId() {
    return this.message.author.id;
  }

  get voiceConnection() {
    return this.voiceConnections.get(this.guildId || this.channelId);
  }

  reply(options: MessageReply | string = '') {
    return this.message.reply(options);
  }

  toJSON() {
    return this.message;
  }

  toString() {
    return `Context (${this.messageId})`;
  }
}
