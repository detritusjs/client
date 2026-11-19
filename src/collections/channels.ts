import {
  BaseClientCollection,
  BaseClientCollectionOptions,
} from './basecollection';

import { Channel } from '../structures/channel';


/**
 * @category Collection Options
 */
export interface ChannelsOptions extends BaseClientCollectionOptions {
  
};

/**
 * Channels Collection
 * @category Collections
 */
export class Channels extends BaseClientCollection<string, Channel> {
  // guild id -> ids of its cached channels and threads, so a guild delete doesn't scan every channel
  readonly _guildChannelIds = new Map<string, Set<string>>();
  // ids of the cached dms/group dms, so finding a shared dm doesn't scan every guild channel
  readonly _dmChannelIds = new Set<string>();

  insert(channel: Channel): void {
    if (this.enabled) {
      this.set(channel.id, channel);
    }
  }

  set(key: string, value: Channel): this {
    const old = this.cache.get(key);
    super.set(key, value);
    if (old && old !== value) {
      this._unindex(key, old);
    }
    if (this.cache.get(key) === value) {
      if (value.guildId) {
        let ids = this._guildChannelIds.get(value.guildId);
        if (!ids) {
          this._guildChannelIds.set(value.guildId, ids = new Set<string>());
        }
        ids.add(key);
      } else {
        this._dmChannelIds.add(key);
      }
    }
    return this;
  }

  delete(key: string): boolean {
    const channel = this.cache.get(key);
    const deleted = super.delete(key);
    if (channel) {
      this._unindex(key, channel);
    }
    return deleted;
  }

  clear(): void {
    super.clear();
    this._guildChannelIds.clear();
    this._dmChannelIds.clear();
  }

  _unindex(key: string, channel: Channel): void {
    if (channel.guildId) {
      const ids = this._guildChannelIds.get(channel.guildId);
      if (ids) {
        ids.delete(key);
        if (!ids.size) {
          this._guildChannelIds.delete(channel.guildId);
        }
      }
    } else {
      this._dmChannelIds.delete(key);
    }
  }

  /**
   * The cached dms and group dms (a new array, so deleting while going through it is fine)
   */
  getDmChannels(): Array<Channel> {
    const channels: Array<Channel> = [];
    for (let channelId of this._dmChannelIds) {
      const channel = this.cache.get(channelId);
      if (channel) {
        channels.push(channel);
      }
    }
    return channels;
  }

  /**
   * The cached channels and threads of a guild (a new array, so deleting while going through it is fine)
   */
  getGuildChannels(guildId: string): Array<Channel> {
    const channels: Array<Channel> = [];
    const ids = this._guildChannelIds.get(guildId);
    if (ids) {
      for (let channelId of ids) {
        const channel = this.cache.get(channelId);
        if (channel) {
          channels.push(channel);
        }
      }
    }
    return channels;
  }

  get [Symbol.toStringTag](): string {
    return `Channels (${this.size.toLocaleString()} items)`;
  }
}
