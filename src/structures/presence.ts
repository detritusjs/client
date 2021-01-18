import { Endpoints } from 'detritus-client-rest';


import { ShardClient } from '../client';
import { BaseCollection, emptyBaseCollection } from '../collections/basecollection';
import { BaseSet } from '../collections/baseset';
import {
  ActivityFlags,
  ActivityPlatformTypes,
  ActivityTypes,
  DiscordKeys,
  PlatformTypes,
  PresenceStatuses,
  SpecialUrls,
  LOCAL_GUILD_ID,
} from '../constants';
import { addQuery, getFormatFromHash, UrlQuery } from '../utils';

import {
  BaseStructure,
  BaseStructureData,
} from './basestructure';
import { Application } from './application';
import { Emoji } from './emoji';
import { User } from './user';


export const SpecialApplications = Object.freeze({
  XBOX: '438122941302046720',
});

export const SpecialPrefixes = Object.freeze({
  SPOTIFY: 'spotify:',
});

export const ImageSizes = Object.freeze({
  SMALL: 64,
  LARGE: 160,
});


const keysPresence = new BaseSet<string>([
  DiscordKeys.ACTIVITIES,
  DiscordKeys.CLIENT_STATUS,
  DiscordKeys.GAME,
  DiscordKeys.GUILD_ID,
  DiscordKeys.GUILD_IDS,
  DiscordKeys.LAST_MODIFIED,
  DiscordKeys.STATUS,
  DiscordKeys.USER,
]);

const keysMergePresence = new BaseSet<string>([
  DiscordKeys.USER,
  DiscordKeys.GUILD_ID,
  DiscordKeys.ACTIVITIES,
]);

const keysSkipDifferencePresence = new BaseSet<string>([
  DiscordKeys.GUILD_ID,
  DiscordKeys.GUILD_IDS,
]);

/**
 * Presence Structure, used to detail a user's presence in a guild (or general if you have them added (non-bots only))
 * @category Structure
 */
export class Presence extends BaseStructure {
  readonly _keys = keysPresence;
  readonly _keysMerge = keysMergePresence;
  readonly _keysSkipDifference = keysSkipDifferencePresence;
  _activities?: BaseCollection<string, PresenceActivity>;
  _guildIds: BaseSet<string> | string = '';

  clientStatus?: {desktop?: string, mobile?: string, web?: string};
  lastGuildId: string = LOCAL_GUILD_ID;
  lastModified?: number;
  status: string = PresenceStatuses.OFFLINE;
  user!: User;

  constructor(client: ShardClient, data: BaseStructureData) {
    super(client);
    this.merge(data);
  }

  get activity(): null | PresenceActivity {
    return this.game;
  }

  get activities(): BaseCollection<string, PresenceActivity> {
    if (this._activities) {
      return this._activities;
    }
    return emptyBaseCollection;
  }

  get game(): null | PresenceActivity {
    if (this._activities) {
      for (let [activityId, activity] of this._activities) {
        if (activity.position === 0) {
          return activity;
        }
      }
      return this._activities.first() || null;
    }
    return null;
  }

  get guildIds(): BaseSet<string> {
    if (typeof(this._guildIds) === 'string') {
      const guildIds = new BaseSet<string>();
      if (this._guildIds) {
        guildIds.add(this._guildIds);
      }
      return guildIds;
    }
    return this._guildIds;
  }

  get isDnd(): boolean {
    return this.status === PresenceStatuses.DND;
  }

  get isIdle(): boolean {
    return this.status === PresenceStatuses.IDLE;
  }

  get isOffline(): boolean {
    return this.status === PresenceStatuses.OFFLINE || this.status === PresenceStatuses.INVISIBLE;
  }

  get isOnline(): boolean {
    return this.status === PresenceStatuses.ONLINE;
  }

  get showMobileIcon(): boolean {
    if (this.clientStatus) {
      return this.clientStatus.mobile === PresenceStatuses.ONLINE;
    }
    return false;
  }

  activityFor(guildId: string): null | PresenceActivity {
    if (this._activities) {
      const activities = this.activitiesFor(guildId);
      for (let [activityId, activity] of activities) {
        if (activity.position === 0) {
          return activity;
        }
      }
      return activities.first() || null;
    }
    return null;
  }

  activitiesFor(guildId: string): BaseCollection<string, PresenceActivity> {
    if (this._activities) {
      const collection = new BaseCollection<string, PresenceActivity>();
      for (let [activityId, activity] of this._activities) {
        if (activity._hasGuildId(guildId)) {
          collection.set(activity.id, activity);
        }
      }
      return collection;
    }
    return emptyBaseCollection;
  }


  get _shouldDelete(): boolean {
    return !this._guildIds;
  }

  _deleteGuildId(guildId: string): void {
    if (typeof(this._guildIds) === 'string') {
      if (this._guildIds === guildId) {
        this._guildIds = '';
        if (this._activities) {
          this._activities.clear();
          this._activities = undefined;
        }
      }
    } else {
      this._guildIds.delete(guildId);
      if (this._guildIds.length) {
        if (this._activities) {
          for (let [activityId, activity] of this._activities) {
            activity._deleteGuildId(guildId);
            if (activity._shouldDelete) {
              this._activities.delete(activityId);
            }
          }
          if (!this._activities.length) {
            this._activities = undefined;
          }
        }

        if (this._guildIds.length === 1) {
          this._guildIds = this._guildIds.first() || '';
        }
      } else {
        this._guildIds = '';
      }
    }
  }

  _hasGuildId(guildId: string): boolean {
    if (typeof(this._guildIds) === 'string') {
      return this._guildIds === guildId;
    } else {
      return this._guildIds.has(guildId);
    }
  }

  mergeValue(key: string, value: any): void {
    if (value !== undefined) {
      switch (key) {
        case DiscordKeys.ACTIVITIES: {
          const guildId = this.lastGuildId;
          if (this._activities) {
            for (let [activityId, activity] of this._activities) {
              activity._deleteGuildId(guildId);
            }
          }

          let isNew = false;
          if (value.length) {
            if (!this._activities) {
              this._activities = new BaseCollection<string, PresenceActivity>();
              isNew = true;
            }
            for (let position = 0; position < value.length; position++) {
              const raw = value[position];
              raw.position = position;

              if (this._activities.has(raw.id)) {
                const activity = this._activities.get(raw.id) as PresenceActivity;
                activity.merge(raw);
              } else {
                const activity = new PresenceActivity(this.user, raw);
                this._activities.set(activity.id, activity);
              }
            }
          }

          if (this._activities && !isNew) {
            for (let [activityId, activity] of this._activities) {
              if (activity._shouldDelete) {
                this._activities.delete(activityId);
              }
            }
            if (!this._activities.length) {
              this._activities = undefined;
            }
          }
        }; return;
        case DiscordKeys.GAME: {
          // itll always be in the activities array
        }; return;
        case DiscordKeys.GUILD_ID: {
          value = value || LOCAL_GUILD_ID;
          this.lastGuildId = value;

          // _guildIds will be a string (if its a single guild) or a set (if the presence is for multiple guilds)
          if (typeof(this._guildIds) === 'string') {
            if (this._guildIds) {
              this._guildIds = new BaseSet<string>([this._guildIds, value]);
            } else {
              this._guildIds = value;
            }
          } else {
            this._guildIds.add(value);
          }
        }; return;
        case DiscordKeys.LAST_MODIFIED: {
          if (value) {
            value = parseInt(value);
          }
        }; break;
        case DiscordKeys.USER: {
          let user: User;
          if (this.client.users.has(value.id)) {
            user = this.client.users.get(value.id) as User;
            user.merge(value);
          } else {
            if (this.user) {
              user = this.user;
              user.merge(value);
            } else {
              user = new User(this.client, value);
              this.client.users.insert(user);
            }
          }
          value = user;
        }; break;
      }
      super.mergeValue(key, value);
    }
  }

  toString(): string {
    return `${this.user} is ${this.status}` + ((this.game) ? ` while ${this.game}` : '');
  }
}


const keysPresenceActivity = new BaseSet<string>([
  DiscordKeys.APPLICATION_ID,
  DiscordKeys.ASSETS,
  DiscordKeys.BUTTONS,
  DiscordKeys.CREATED_AT,
  DiscordKeys.DETAILS,
  DiscordKeys.EMOJI,
  DiscordKeys.FLAGS,
  DiscordKeys.GUILD_ID,
  DiscordKeys.GUILD_IDS,
  DiscordKeys.ID,
  DiscordKeys.INSTANCE,
  DiscordKeys.METADATA,
  DiscordKeys.NAME,
  DiscordKeys.PARTY,
  DiscordKeys.PLATFORM,
  DiscordKeys.POSITION,
  DiscordKeys.SECRETS,
  DiscordKeys.SESSION_ID,
  DiscordKeys.STATE,
  DiscordKeys.SYNC_ID,
  DiscordKeys.TIMESTAMPS,
  DiscordKeys.TYPE,
  DiscordKeys.URL,
]);

const keysMergePresenceActivity = new BaseSet<string>([
  DiscordKeys.GUILD_ID,
]);

const keysSkipDifferencePresenceActivity = new BaseSet<string>([
  DiscordKeys.GUILD_ID,
  DiscordKeys.GUILD_IDS,
]);

/**
 * Presence Activity Structure, used in [Presence]
 * @category Structure
 */
export class PresenceActivity extends BaseStructure {
  readonly _keys = keysPresenceActivity;
  readonly _keysMerge = keysMergePresenceActivity;
  readonly _keysSkipDifference = keysSkipDifferencePresenceActivity;
  readonly user: User;
  _guildIds: BaseSet<string> | string = '';

  applicationId?: string;
  assets?: PresenceActivityAssets;
  buttons?: Array<string>;
  createdAt?: number;
  details?: string;
  emoji?: Emoji;
  flags: number = 0;
  id: string = '';
  instance?: boolean;
  metadata?: any;
  name: string = '';
  party?: {id?: string, size?: [number, number]};
  platform?: ActivityPlatformTypes;
  position: number = 0;
  secrets?: {join?: string, match?: string, spectate?: string};
  sessionId?: string;
  state?: string;
  syncId?: string;
  timestamps?: PresenceActivityTimestamps;
  type: number = 0;
  url?: string;

  constructor(user: User, data: BaseStructureData) {
    super(user.client);
    this.user = user;
    this.merge(data);
  }

  get application(): Application | null {
    if (this.applicationId && this.client.applications.has(this.applicationId)) {
      return this.client.applications.get(this.applicationId) as Application;
    }
    if (!this.user.bot && this.name && this.isPlaying) {
      for (let [applicationId, application] of this.client.applications) {
        if (application.matches(this.name)) {
          return application;
        }
      }
    }
    return null;
  }

  get applicationIsXbox(): boolean {
    return this.applicationId === SpecialApplications.XBOX;
  }

  get canInstance(): boolean {
    return this.hasFlag(ActivityFlags.INSTANCE);
  }

  get canJoin(): boolean {
    return this.hasFlag(ActivityFlags.JOIN);
  }

  get canJoinRequest(): boolean {
    return this.hasFlag(ActivityFlags.JOIN_REQUEST);
  }

  get canPlay(): boolean {
    return this.hasFlag(ActivityFlags.PLAY);
  }

  get canSpectate(): boolean {
    return this.hasFlag(ActivityFlags.SPECTATE);
  }

  get canSync(): boolean {
    return this.hasFlag(ActivityFlags.SYNC);
  }

  get group(): BaseCollection<string, User> {
    const group = new BaseCollection<string, User>();
    if (this.party && this.party.id) {
      const me = this.user;
      group.set(me.id, me);

      for (let [userId, presence] of this.client.presences) {
        if (group.has(userId)) {
          continue;
        }
        for (let [activityId, activity] of presence.activities) {
          if (activity.party && activity.party.id === this.id) {
            group.set(userId, presence.user);
            break;
          }
        }
      }
    }
    return group;
  }

  get guildIds(): BaseSet<string> {
    if (typeof(this._guildIds) === 'string') {
      const guildIds = new BaseSet<string>();
      if (this._guildIds) {
        guildIds.add(this._guildIds);
      }
      return guildIds;
    }
    return this._guildIds;
  }

  get imageUrl(): null | string {
    return this.imageUrlFormat();
  }

  get isCustomStatus(): boolean {
    return this.type === ActivityTypes.CUSTOM_STATUS;
  }

  get isListening(): boolean {
    return this.type === ActivityTypes.LISTENING;
  }

  get isPlaying(): boolean {
    return this.type === ActivityTypes.PLAYING;
  }

  get isStreaming(): boolean {
    return this.type === ActivityTypes.STREAMING;
  }

  get isWatching(): boolean {
    return this.type === ActivityTypes.WATCHING;
  }

  get isOnAndroid(): boolean {
    return this.platformType === ActivityPlatformTypes.ANDROID;
  }

  get isOnIOS(): boolean {
    return this.platformType === ActivityPlatformTypes.IOS;
  }

  get isOnSpotify(): boolean {
    return (
      this.isListening &&
      !!(this.id && this.id.startsWith(SpecialPrefixes.SPOTIFY)) &&
      !!(this.partyIsSpotify)
    );
  }

  get isOnSamsung(): boolean {
    return this.platformType === ActivityPlatformTypes.SAMSUNG;
  }

  get isOnXbox(): boolean {
    return this.platformType === ActivityPlatformTypes.XBOX;
  }


  get partyIsFull(): boolean {
    if (this.party && this.party.size) {
      return this.partySize === this.partyMaxSize;
    }
    return false;
  }

  get partyIsSpotify(): boolean {
    if (this.party && this.party.id) {
      return this.party.id.startsWith(SpecialPrefixes.SPOTIFY);
    }
    return false;
  }

  get partyMaxSize(): number | null {
    if (this.party && this.party.size) {
      return this.party.size[1];
    }
    return null;
  }

  get partySize(): number | null {
    if (this.party && this.party.size) {
      return this.party.size[0];
    }
    return null;
  }

  get platformType(): string {
    // should we check `isPlaying`? the client returns null if they aren't
    if (this.applicationIsXbox) {
      return ActivityPlatformTypes.XBOX;
    }
    if (this.platform) {
      return this.platform;
    }
    return ActivityPlatformTypes.DESKTOP;
  }


  get platformDiscordUrl(): null | string {
    if (this.applicationId) {
      // now this might not be on discord
      // you need to check if the application exists on discord (by fetching it)
      return (
        Endpoints.Routes.URL +
        Endpoints.Routes.APPLICATION_STORE_LISTING_SKU(this.applicationId)
      );
    }
    return null;
  }

  get spotifyTrackUrl(): null | string {
    if (this.isOnSpotify && this.syncId) {
      return SpecialUrls.SPOTIFY_TRACK(this.syncId);
    }
    return null;
  }

  get typeText(): string {
    switch (this.type) {
      case ActivityTypes.PLAYING: return 'Playing';
      case ActivityTypes.STREAMING: return 'Streaming';
      case ActivityTypes.LISTENING: return 'Listening to';
      case ActivityTypes.WATCHING: return 'Watching';
      case ActivityTypes.CUSTOM_STATUS: return '';
    }
    return 'Unknown';
  }

  hasFlag(flag: number): boolean {
    return (this.flags & flag) === flag;
  }

  imageUrlFormat(format?: null | string, query?: UrlQuery): null | string {
    if (this.assets) {
      return this.assets.imageUrlFormat(format, query);
    }
    const application = this.application;
    if (application) {
      return application.iconUrlFormat(format, query);
    }
    return null;
  }

  async fetchApplication(): Promise<Application | null> {
    if (this.applicationId) {
      return this.client.rest.fetchApplication(this.applicationId);
    }
    return null;
  }

  async fetchButtonUrls() {
    if (!this.sessionId) {
      throw new Error('Activity has no Session Id');
    }
    if (!this.applicationId) {
      throw new Error('Activity has no Application Id');
    }
    if (!this.buttons) {
      throw new Error('Activity has no buttons');
    }
    return this.client.rest.fetchUserActivityMetadata(
      this.user.id,
      this.sessionId,
      String(this.applicationId),
    );
  }

  async fetchMetadata() {
    if (!this.sessionId) {
      throw new Error('Activity has no Session Id');
    }
    return this.client.rest.fetchUserActivityMetadata(
      this.user.id,
      this.sessionId,
      String(this.position),
    );
  }


  get _shouldDelete(): boolean {
    return !this._guildIds;
  }

  _deleteGuildId(guildId: string): void {
    if (typeof(this._guildIds) === 'string') {
      if (this._guildIds === guildId) {
        this._guildIds = '';
      }
    } else {
      this._guildIds.delete(guildId);
      if (this._guildIds.length) {
        if (this._guildIds.length === 1) {
          this._guildIds = this._guildIds.first() || '';
        }
      } else {
        this._guildIds = '';
      }
    }
  }

  _hasGuildId(guildId: string): boolean {
    if (typeof(this._guildIds) === 'string') {
      return this._guildIds === guildId;
    } else {
      return this._guildIds.has(guildId);
    }
  }

  mergeValue(key: string, value: any): void {
    switch (key) {
      case DiscordKeys.GUILD_ID: {
        value = value || LOCAL_GUILD_ID;
        if (typeof(this._guildIds) === 'string') {
          if (this._guildIds) {
            this._guildIds = new BaseSet<string>([this._guildIds, value]);
          } else {
            this._guildIds = value;
          }
        } else {
          this._guildIds.add(value);
        }
      }; return;
    }
    if (value !== undefined && value !== null) {
      // just replace our objects since they're of new values
      if (typeof(value) === 'object') {
        if (Object.keys(value).length) {
          switch (key) {
            case DiscordKeys.ASSETS: {
              if (this.assets) {
                this.assets.merge(value);
              } else {
                this.assets = new PresenceActivityAssets(this, value);
              }
            }; return;
            case DiscordKeys.EMOJI: {
              // reason is that `name` can be spoofed here
              if (this.emoji) {
                this.emoji.merge(value);
              } else {
                this.emoji = new Emoji(this.client, value);
              }
            }; return;
            case DiscordKeys.TIMESTAMPS: {
              if (this.timestamps) {
                this.timestamps.merge(value);
              } else {
                this.timestamps = new PresenceActivityTimestamps(this, value);
              }
            }; return;
          }
        } else {
          value = undefined;
        }
        return this._setFromSnake(key, value);
      }
    }
    return super.mergeValue(key, value);
  }

  toString(): string {
    return `${this.typeText} ${this.name}`;
  }
}


const keysPresenceActivityAssets = new BaseSet<string>([
  DiscordKeys.LARGE_IMAGE,
  DiscordKeys.LARGE_TEXT,
  DiscordKeys.SMALL_IMAGE,
  DiscordKeys.SMALL_TEXT,
]);

const keysMergePresenceActivityAssets = keysPresenceActivityAssets;

/**
 * Presence Activity Assets Structure, used in [PresenceActivity]
 * @category Structure
 */
export class PresenceActivityAssets extends BaseStructure {
  readonly _keys = keysPresenceActivityAssets;
  readonly _keysMerge = keysMergePresenceActivityAssets;
  readonly activity: PresenceActivity;

  largeImage?: string;
  largeText?: string;
  smallImage?: string;
  smallText?: string;

  constructor(activity: PresenceActivity, data: BaseStructureData) {
    super(activity.client);
    this.activity = activity;
    this.merge(data);
  }

  get imageUrl() {
    return this.imageUrlFormat();
  }

  get largeImageUrl() {
    return this.largeImageUrlFormat();
  }

  get smallImageUrl() {
    return this.smallImageUrlFormat();
  }

  imageUrlFormat(
    format?: null | string,
    query?: UrlQuery,
    hash?: null | string,
  ): null | string {
    if (hash === undefined) {
      hash = this.largeImage || this.smallImage;
    }
    if (!hash) {
      return null;
    }
    format = getFormatFromHash(
      hash,
      format,
      this.client.imageFormat,
    );

    if (hash.includes(':')) {
      const [platform, id] = hash.split(':');
      switch (platform) {
        case PlatformTypes.SPOTIFY: {
          return addQuery(
            Endpoints.CDN.CUSTOM_SPOTIFY(id),
            query,
          );
        };
        case PlatformTypes.TWITCH: {
          let height = ImageSizes.LARGE;
          let width = ImageSizes.LARGE;
          if (query) {
            if (query.size !== undefined) {
              height = query.size;
              width = query.size;
            }
          }
          return addQuery(
            Endpoints.CDN.CUSTOM_TWITCH(id, height, width),
            query,
          );
        };
      }
    } else {
      // treat it as a normal hash
      return addQuery(
        Endpoints.CDN.URL + Endpoints.CDN.APP_ASSET(this.activity.applicationId, hash, format),
        query,
      );
    }
    return null;
  }

  largeImageUrlFormat(format?: null | string, query?: UrlQuery) {
    return this.imageUrlFormat(format, query, this.largeImage || null);
  }

  smallImageUrlFormat(format?: null | string, query?: UrlQuery) {
    return this.imageUrlFormat(format, query, this.smallImage || null);
  }

  mergeValue(key: string, value: any): void {
    return this._setFromSnake(key, value);
  }
}



const keysPresenceActivityTimestamps = new BaseSet<string>([
  DiscordKeys.END,
  DiscordKeys.START,
]);

const keysMergePresenceActivityTimestamps = keysPresenceActivityTimestamps;

/**
 * Presence Activity Timestamp Structure
 * used to describe when they started doing an activity and if they ended it or not
 * @category Structure
 */
export class PresenceActivityTimestamps extends BaseStructure {
  readonly _keys = keysPresenceActivityTimestamps;
  readonly _keysMerge = keysMergePresenceActivityTimestamps;
  readonly activity: PresenceActivity;

  end?: number = 0;
  start?: number = 0;

  constructor(activity: PresenceActivity, data: BaseStructureData) {
    super(activity.client);
    this.activity = activity;
    this.merge(data);
  }

  get elapsedTime(): number {
    let elapsed: number;
    if (this.start) {
      elapsed = Math.max(Date.now() - this.start, 0);
    } else {
      elapsed = Date.now();
    }

    const total = this.totalTime;
    if (total) {
      return Math.min(elapsed, total);
    }
    return elapsed;
  }

  get totalTime(): number {
    if (this.end) {
      if (this.start) {
        return this.end - this.start;
      }
      return this.end;
    }
    return 0;
  }

  mergeValue(key: string, value: any): void {
    return this._setFromSnake(key, value);
  }
}
