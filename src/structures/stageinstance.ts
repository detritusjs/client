import { RequestTypes } from 'detritus-client-rest';

import { ShardClient } from '../client';
import { BaseCollection, emptyBaseCollection } from '../collections/basecollection';
import { BaseSet } from '../collections/baseset';
import { DiscordKeys, StagePrivacyLevels } from '../constants';

import {
  BaseStructure,
  BaseStructureData,
} from './basestructure';
import { Channel } from './channel';
import { Guild } from './guild';
import { VoiceState } from './voicestate';


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
    return emptyBaseCollection;
  }

  get moderators(): BaseCollection<string, VoiceState> {
    return emptyBaseCollection;
  }

  get speakers(): BaseCollection<string, VoiceState> {
    return emptyBaseCollection;
  }

  get voiceStates(): BaseCollection<string, VoiceState> {
    if (this.client.voiceStates.has(this.channelId)) {
      return this.client.voiceStates.get(this.channelId) as BaseCollection<string, VoiceState>;
    }
    return emptyBaseCollection;
  }

  edit(options: RequestTypes.EditStageInstance = {}) {
    return this.client.rest.editStageInstance(this.channelId, options);
  }

  fetch() {
    return this.client.rest.fetchStageInstance(this.channelId);
  }

  delete() {
    return this.client.rest.deleteStageInstance(this.channelId);
  }
}
