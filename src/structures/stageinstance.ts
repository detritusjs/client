import { RequestTypes } from 'detritus-client-rest';

import { ShardClient } from '../client';
import { BaseCollection } from '../collections/basecollection';
import { BaseSet } from '../collections/baseset';
import { DetritusKeys, DiscordKeys, Permissions, StagePrivacyLevels } from '../constants';

import {
  BaseStructure,
  BaseStructureData,
} from './basestructure';
import { Channel } from './channel';
import { Guild } from './guild';
import { VoiceState } from './voicestate';


const PERMISSIONS_STAGE_MODERATOR = [
  Permissions.MANAGE_CHANNELS,
  Permissions.MOVE_MEMBERS,
  Permissions.MUTE_MEMBERS,
];

const keysStageInstance = new BaseSet<string>([
  DiscordKeys.CHANNEL_ID,
  DiscordKeys.DISCOVERABLE_DISABLED,
  DiscordKeys.GUILD_ID,
  DiscordKeys.GUILD_SCHEDULED_EVENT_ID,
  DiscordKeys.ID,
  DiscordKeys.INVITE_CODE,
  DiscordKeys.PRIVACY_LEVEL,
  DiscordKeys.TOPIC,
]);


/**
 * Stage Instance Structure
 * @category Structure
 */
export class StageInstance extends BaseStructure {
  readonly _keys = keysStageInstance;

  channelId: string = '';
  deleted: boolean = false;
  discoverableDisabled: boolean = false;
  guildId: string = '';
  guildScheduledEventId: null | string = null;
  id: string = '';
  inviteCode: null | string = null;
  privacyLevel: StagePrivacyLevels = StagePrivacyLevels.PUBLIC;
  topic: string = '';

  constructor(
    client: ShardClient,
    data?: BaseStructureData,
    isClone?: boolean,
  ) {
    super(client, undefined, isClone);
    this.merge(data);
  }

  get channel(): Channel | null {
    return this.client.channels.get(this.channelId) || null;
  }

  get guild(): Guild | null {
    return this.client.guilds.get(this.guildId) || null;
  }

  get isGuildOnly(): boolean {
    return this.privacyLevel === StagePrivacyLevels.GUILD_ONLY;
  }

  get isPublic(): boolean {
    return this.privacyLevel === StagePrivacyLevels.PUBLIC;
  }

  get listeners(): BaseCollection<string, VoiceState> {
    const collection = new BaseCollection<string, VoiceState>();
    for (let [userId, voiceState] of this.voiceStates) {
      if (voiceState.suppress) {
        collection.set(userId, voiceState);
      }
    }
    return collection;
  }

  get moderators(): BaseCollection<string, VoiceState> {
    const collection = new BaseCollection<string, VoiceState>();
    const channel = this.channel;
    if (channel) {
      for (let [userId, voiceState] of this.voiceStates) {
        const member = voiceState.member || this.client.members.get(this.guildId, userId);
        if (member && channel.can(PERMISSIONS_STAGE_MODERATOR, member)) {
          collection.set(userId, voiceState);
        }
      }
    }
    return collection;
  }

  get speakers(): BaseCollection<string, VoiceState> {
    const collection = new BaseCollection<string, VoiceState>();
    for (let [userId, voiceState] of this.voiceStates) {
      if (!voiceState.suppress) {
        collection.set(userId, voiceState);
      }
    }
    return collection;
  }

  get voiceStates(): BaseCollection<string, VoiceState> {
    // guild voice states are cached under the guild id
    const collection = new BaseCollection<string, VoiceState>();
    const voiceStates = this.client.voiceStates.get(this.guildId);
    if (voiceStates) {
      for (let [userId, voiceState] of voiceStates) {
        if (voiceState.channelId === this.channelId) {
          collection.set(userId, voiceState);
        }
      }
    }
    return collection;
  }

  async edit(options: RequestTypes.EditStageInstance = {}) {
    return this.client.rest.editStageInstance(this.channelId, options);
  }

  async fetch() {
    return this.client.rest.fetchStageInstance(this.channelId);
  }

  async delete() {
    return this.client.rest.deleteStageInstance(this.channelId);
  }

  merge(data?: BaseStructureData): void {
    if (!data) {
      return;
    }

    if (DiscordKeys.CHANNEL_ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.CHANNEL_ID]] = data[DiscordKeys.CHANNEL_ID];
    }
    if (DiscordKeys.DISCOVERABLE_DISABLED in data) {
      (this as any)[DetritusKeys[DiscordKeys.DISCOVERABLE_DISABLED]] = data[DiscordKeys.DISCOVERABLE_DISABLED];
    }
    if (DiscordKeys.GUILD_ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.GUILD_ID]] = data[DiscordKeys.GUILD_ID];
    }
    if (DiscordKeys.GUILD_SCHEDULED_EVENT_ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.GUILD_SCHEDULED_EVENT_ID]] = data[DiscordKeys.GUILD_SCHEDULED_EVENT_ID];
    }
    if (DiscordKeys.ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.ID]] = data[DiscordKeys.ID];
    }
    if (DiscordKeys.INVITE_CODE in data) {
      (this as any)[DetritusKeys[DiscordKeys.INVITE_CODE]] = data[DiscordKeys.INVITE_CODE];
    }
    if (DiscordKeys.PRIVACY_LEVEL in data) {
      (this as any)[DetritusKeys[DiscordKeys.PRIVACY_LEVEL]] = data[DiscordKeys.PRIVACY_LEVEL];
    }
    if (DiscordKeys.TOPIC in data) {
      (this as any)[DetritusKeys[DiscordKeys.TOPIC]] = data[DiscordKeys.TOPIC];
    }
  }
}
