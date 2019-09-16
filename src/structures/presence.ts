import { Endpoints } from 'detritus-client-rest';


import { ShardClient } from '../client';
import { BaseCollection, emptyBaseCollection } from '../collections/basecollection';
import { BaseSet } from '../collections/baseset';
import {
  ActivityFlags,
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

  clientStatus?: PresenceClientStatus;
  game?: null | PresenceActivity;
  guildIds = new BaseSet<string>();
  lastGuildId: string = LOCAL_GUILD_ID;
  lastModified?: number;
  status: string = PresenceStatuses.OFFLINE;
  user!: User;

  constructor(client: ShardClient, data: BaseStructureData) {
    super(client);
    this.merge(data);
    Object.defineProperty(this, '_activities', {enumerable: false, writable: true});
  }

  get activity(): null | PresenceActivity | undefined {
    return this.game;
  }

  get activities(): BaseCollection<string, PresenceActivity> {
    if (this._activities) {
      return this._activities;
    }
    return emptyBaseCollection;
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

  mergeValue(key: string, value: any): void {
    if (value !== undefined) {
      switch (key) {
        case DiscordKeys.ACTIVITIES: {
          const guildId = this.lastGuildId;
          if (this._activities) {
            for (let [activityId, activity] of this._activities) {
              activity.guildIds.delete(guildId);
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
                const activity = <PresenceActivity> this._activities.get(raw.id);
                activity.merge(raw);
              } else {
                const activity = new PresenceActivity(this, raw);
                this._activities.set(activity.id, activity);
              }
            }
          }

          if (this._activities && !isNew) {
            for (let [activityId, activity] of this._activities) {
              if (!activity.guildIds.length) {
                this._activities.delete(activityId);
              }
            }
            if (!this._activities.length) {
              this._activities = undefined;
            }
          }
        }; return;
        case DiscordKeys.CLIENT_STATUS: {
          if (this.clientStatus) {
            this.clientStatus.merge(value);
          } else {
            this.clientStatus = new PresenceClientStatus(this, value);
          }
        }; return;
        case DiscordKeys.GAME: {
          if (value) {
            if (value.id) {
              if (this.activities.has(value.id)) {
                value = <PresenceActivity> this.activities.get(value.id);
              } else {
                value = null;
                // should we make the activity? this should never happen
              }
            } else if (!Object.keys(value).length) {
              value = null;
            }
          }
        }; break;
        case DiscordKeys.GUILD_ID: {
          this.lastGuildId = value || LOCAL_GUILD_ID;
          this.guildIds.add(this.lastGuildId);
        }; return;
        case DiscordKeys.USER: {
          let user: User;
          if (this.client.users.has(value.id)) {
            user = <User> this.client.users.get(value.id);
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
      super.mergeValue.call(this, key, value);
    }
  }

  toString(): string {
    return `${this.user} is ${this.status}` + ((this.game) ? ` while ${this.game}` : '');
  }
}


const keysPresenceActivity = new BaseSet<string>([
  DiscordKeys.APPLICATION_ID,
  DiscordKeys.ASSETS,
  DiscordKeys.CREATED_AT,
  DiscordKeys.DETAILS,
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
  readonly presence: Presence;

  applicationId?: string;
  assets?: PresenceActivityAssets;
  createdAt?: number;
  details?: string;
  flags: number = 0;
  guildIds = new BaseSet<string>();
  id: string = '';
  instance?: boolean;
  metadata?: any;
  name: string = '';
  party?: PresenceActivityParty;
  platform?: string;
  position: number = 0;
  secrets?: PresenceActivitySecrets;
  sessionId?: string;
  state?: string;
  syncId?: string;
  timestamps?: PresenceActivityTimestamps;
  type: number = 0;
  url?: string;

  constructor(presence: Presence, data: BaseStructureData) {
    super(presence.client);
    this.presence = presence;
    this.merge(data);
    Object.defineProperty(this, 'presence', {enumerable: false, writable: false});
  }

  get application(): Application | null {
    if (this.applicationId && this.client.applications.has(this.applicationId)) {
      return <Application> this.client.applications.get(this.applicationId);
    }
    if (!this.presence.user.bot && this.name) {
      return this.client.applications.find((application) => {
        return application.name === this.name;
      }) || null;
    }
    return null;
  }

  get group(): BaseCollection<string, User> | null {
    if (this.party) {
      return this.party.group;
    }
    return null;
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

  get isOnSpotify(): boolean {
    return (
      this.isListening &&
      !!(this.id && this.id.startsWith(SpecialPrefixes.SPOTIFY)) &&
      !!(this.party && this.party.isSpotify)
    );
  }

  get isOnXbox(): boolean {
    return this.applicationId === SpecialApplications.XBOX;
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

  async fetchMetadata() {
    if (!this.sessionId) {
      throw new Error('Activity has no Session Id');
    }
    return this.client.rest.fetchUserActivityMetadata(
      this.presence.user.id,
      this.sessionId,
      String(this.position),
    );
  }

  mergeValue(key: string, value: any): void {
    switch (key) {
      case DiscordKeys.GUILD_ID: {
        this.guildIds.add(value || LOCAL_GUILD_ID);
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
            case DiscordKeys.PARTY: {
              if (this.party) {
                this.party.merge(value);
              } else {
                this.party = new PresenceActivityParty(this, value);
              }
            }; return;
            case DiscordKeys.SECRETS: {
              if (this.secrets) {
                this.secrets.merge(value);
              } else {
                this.secrets = new PresenceActivitySecrets(this, value);
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
    return super.mergeValue.call(this, key, value);
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
    Object.defineProperty(this, 'activity', {enumerable: false, writable: false});
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


const keysPresenceActivityParty = new BaseSet<string>([
  DiscordKeys.ID,
  DiscordKeys.SIZE,
]);

const keysMergePresenceActivityParty = keysPresenceActivityParty;

/**
 * Presence Activity Party Structure, used in [PresenceActivity]
 * describe's the user's current party (listening party, game party, etc..)
 * @category Structure
 */
export class PresenceActivityParty extends BaseStructure {
  readonly _keys = keysPresenceActivityParty;
  readonly _keysMerge = keysMergePresenceActivityParty;
  readonly activity: PresenceActivity;

  id?: string;
  size?: [number, number];

  constructor(activity: PresenceActivity, data: BaseStructureData) {
    super(activity.client);
    this.activity = activity;
    this.merge(data);
    Object.defineProperty(this, 'activity', {enumerable: false, writable: false});
  }

  get currentSize(): number | null {
    if (this.size) {
      return this.size[0];
    }
    return null;
  }

  get group(): BaseCollection<string, User> {
    const group = new BaseCollection<string, User>();
    if (this.id) {
      const me = this.activity.presence.user;
      group.set(me.id, me);

      for (let [userId, presence] of this.client.presences) {
        if (group.has(userId)) {
          continue;
        }
        if (presence.activities && presence.activities.length) {
          for (let [activityId, activity] of presence.activities) {
            if (activity.party && activity.party.id === this.id) {
              group.set(userId, presence.user);
              break;
            }
          }
        }
      }
    }
    return group;
  }

  get isFull(): boolean {
    if (this.size) {
      return this.currentSize === this.maxSize;
    }
    return false;
  }

  get isSpotify(): boolean {
    return !!this.id && this.id.startsWith(SpecialPrefixes.SPOTIFY);
  }

  get maxSize(): number | null {
    if (this.size) {
      return this.size[1];
    }
    return null;
  }

  mergeValue(key: string, value: any): void {
    return this._setFromSnake(key, value);
  }
}


const keysPresenceActivitySecrets = new BaseSet<string>([
  DiscordKeys.JOIN,
  DiscordKeys.MATCH,
  DiscordKeys.SPECTATE,
]);

const keysMergePresenceActivitySecrets = keysPresenceActivitySecrets;

/**
 * Presence Activity Secrets Structure
 * used to join someone's game
 * @category Structure
 */
export class PresenceActivitySecrets extends BaseStructure {
  readonly _keys = keysPresenceActivitySecrets;
  readonly _keysMerge = keysMergePresenceActivitySecrets;
  readonly activity: PresenceActivity;

  join?: string;
  match?: string;
  spectate?: string;

  constructor(activity: PresenceActivity, data: BaseStructureData) {
    super(activity.client);
    this.activity = activity;
    this.merge(data);
    Object.defineProperty(this, 'activity', {enumerable: false, writable: false});
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

  end?: number;
  start: number = 0;

  constructor(activity: PresenceActivity, data: BaseStructureData) {
    super(activity.client);
    this.activity = activity;
    this.merge(data);
    Object.defineProperty(this, 'activity', {enumerable: false, writable: false});
  }

  get elapsedTime(): number {
    const total = this.totalTime;
    const elapsed = Math.max(Date.now() - this.start, 0);
    if (total) {
      return Math.min(elapsed, total);
    }
    return elapsed;
  }

  get totalTime(): number {
    if (this.end) {
      return this.end - this.start;
    }
    return 0;
  }

  mergeValue(key: string, value: any): void {
    return this._setFromSnake(key, value);
  }
}


const keysPresenceClientStatus = new BaseSet<string>([
  DiscordKeys.DESKTOP,
  DiscordKeys.MOBILE,
  DiscordKeys.WEB,
]);

const keysMergePresenceClientStatus = keysPresenceClientStatus;

/**
 * Presence Client Status Structure, used in [Presence]
 * used to describe if a person is on desktop, mobile, web, etc..
 * @category Structure
 */
export class PresenceClientStatus extends BaseStructure {
  readonly _keys = keysPresenceClientStatus;
  readonly _keysMerge = keysMergePresenceClientStatus;
  readonly presence: Presence;

  desktop?: string;
  mobile?: string;
  web?: string;

  constructor(presence: Presence, data: BaseStructureData) {
    super(presence.client);
    this.presence = presence;
    this.merge(data);
    Object.defineProperty(this, 'presence', {enumerable: false, writable: false});
  }

  get isOnDesktop(): boolean {
    return !!this.desktop;
  }

  get isOnMobile(): boolean {
    return !!this.mobile;
  }

  get isOnWeb(): boolean {
    return !!this.web;
  }

  get isOnlineOnDesktop(): boolean {
    return this.desktop === PresenceStatuses.ONLINE;
  }

  get isOnlineOnMobile(): boolean {
    return this.mobile === PresenceStatuses.ONLINE;
  }

  get isOnlineOnWeb(): boolean {
    return this.web === PresenceStatuses.ONLINE;
  }

  mergeValue(key: string, value: any): void {
    return this._setFromSnake(key, value);
  }
}
