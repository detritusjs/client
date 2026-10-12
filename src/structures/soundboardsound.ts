import { Endpoints, RequestTypes } from 'detritus-client-rest';

import { ShardClient } from '../client';
import { BaseSet } from '../collections/baseset';
import { DetritusKeys, DiscordKeys } from '../constants';
import { Snowflake } from '../utils';

import {
  BaseStructure,
  BaseStructureData,
} from './basestructure';
import { Guild } from './guild';
import { User } from './user';


const keysSoundboardSound = new BaseSet<string>([
  DiscordKeys.AVAILABLE,
  DiscordKeys.EMOJI_ID,
  DiscordKeys.EMOJI_NAME,
  DiscordKeys.GUILD_ID,
  DiscordKeys.NAME,
  DiscordKeys.SOUND_ID,
  DiscordKeys.USER,
  DiscordKeys.VOLUME,
]);

/**
 * Soundboard Sound Structure
 * default sounds have no `guildId`
 * @category Structure
 */
export class SoundboardSound extends BaseStructure {
  readonly _keys = keysSoundboardSound;

  available: boolean = true;
  emojiId: null | string = null;
  emojiName: null | string = null;
  guildId?: string;
  name: string = '';
  soundId: string = '';
  user?: User;
  volume: number = 1;

  constructor(client: ShardClient, data?: BaseStructureData, isClone?: boolean) {
    super(client, undefined, isClone);
    this.merge(data);
  }

  get createdAt(): Date {
    return new Date(this.createdAtUnix);
  }

  get createdAtUnix(): number {
    return Snowflake.timestamp(this.soundId);
  }

  get guild(): Guild | null {
    if (this.guildId) {
      return this.client.guilds.get(this.guildId) || null;
    }
    return null;
  }

  get id(): string {
    return this.soundId;
  }

  get isDefault(): boolean {
    return !this.guildId;
  }

  get url(): string {
    return Endpoints.CDN.URL + `/soundboard-sounds/${this.soundId}`;
  }

  delete(options: RequestTypes.DeleteGuildSoundboardSound = {}) {
    if (!this.guildId) {
      throw new Error('Default sounds cannot be deleted');
    }
    return this.client.rest.deleteGuildSoundboardSound(this.guildId, this.soundId, options);
  }

  edit(options: RequestTypes.EditGuildSoundboardSound = {}) {
    if (!this.guildId) {
      throw new Error('Default sounds cannot be edited');
    }
    return this.client.rest.editGuildSoundboardSound(this.guildId, this.soundId, options);
  }

  send(channelId: string) {
    const channel = this.client.channels.get(channelId);
    const sourceGuildId = (this.guildId && (!channel || channel.guildId !== this.guildId)) ? this.guildId : undefined;
    return this.client.rest.sendSoundboardSound(channelId, {soundId: this.soundId, sourceGuildId});
  }

  merge(data?: BaseStructureData): void {
    if (!data) {
      return;
    }

    if (DiscordKeys.AVAILABLE in data) {
      (this as any)[DetritusKeys[DiscordKeys.AVAILABLE]] = data[DiscordKeys.AVAILABLE];
    }
    if (DiscordKeys.EMOJI_ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.EMOJI_ID]] = data[DiscordKeys.EMOJI_ID];
    }
    if (DiscordKeys.EMOJI_NAME in data) {
      (this as any)[DetritusKeys[DiscordKeys.EMOJI_NAME]] = data[DiscordKeys.EMOJI_NAME];
    }
    if (DiscordKeys.GUILD_ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.GUILD_ID]] = data[DiscordKeys.GUILD_ID];
    }
    if (DiscordKeys.NAME in data) {
      (this as any)[DetritusKeys[DiscordKeys.NAME]] = data[DiscordKeys.NAME];
    }
    if (DiscordKeys.SOUND_ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.SOUND_ID]] = data[DiscordKeys.SOUND_ID];
    }
    if (DiscordKeys.USER in data) {
      const value = data[DiscordKeys.USER];

      let user: User;
      if (this.isClone) {
        user = new User(this.client, value);
      } else {
        if (this.client.users.has(value.id)) {
          user = this.client.users.get(value.id)!;
          user.merge(value);
        } else {
          user = new User(this.client, value);
          this.client.users.insert(user);
        }
      }
      (this as any)[DetritusKeys[DiscordKeys.USER]] = user;
    }
    if (DiscordKeys.VOLUME in data) {
      (this as any)[DetritusKeys[DiscordKeys.VOLUME]] = data[DiscordKeys.VOLUME];
    }
  }
}
