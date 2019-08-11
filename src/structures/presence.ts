import { Endpoints } from 'detritus-client-rest';
import { Constants as SocketConstants } from 'detritus-client-socket';

const {
  GatewayActivityFlags: ActivityFlags,
  GatewayPresenceTypes: ActivityTypes,
  GatewayPresenceStatuses: PresenceStatuses,
} = SocketConstants;


import { ShardClient } from '../client';
import { BaseCollection } from '../collections/basecollection';
import { DEFAULT_PRESENCE_CACHE_KEY } from '../collections/presences';
import { PlatformTypes, SpecialUrls } from '../constants';
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


const keysPresence: ReadonlyArray<string> = [
  'activities',
  'client_status',
  'game',
  'guild_id',
  'last_modified',
  'status',
  'user',
];

const keysMergePresence: ReadonlyArray<string> = [
  'activities',
];

/**
 * Presence Structure, used to detail a user's presence in a guild (or general if you have them added (non-bots only))
 * @category Structure
 */
export class Presence extends BaseStructure {
  readonly _keys = keysPresence;
  readonly _keysMerge = keysMergePresence;

  activities = new BaseCollection<number | string, PresenceActivity>();
  clientStatus?: PresenceClientStatus;
  game?: null | PresenceActivity;
  guildId: string = '';
  lastModified?: number;
  status: string = PresenceStatuses.OFFLINE;
  user!: User;

  constructor(client: ShardClient, data: BaseStructureData) {
    super(client);
    this.merge(data);
  }

  get activity(): null | PresenceActivity | undefined {
    return this.game;
  }

  get cacheId(): string {
    return this.guildId || DEFAULT_PRESENCE_CACHE_KEY;
  }

  get fromGuild(): boolean {
    return !!this.guildId;
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

  difference(key: string, value: any): [boolean, any] {
    let differences: any;
    switch (key) {
      case 'activities': {
        // sift through all the activities and compare each
        // compare lengths
        // return {activities: []};
      }; break;
      case 'client_status': {
        if (this.clientStatus) {
          differences = this.clientStatus.differences(value);
        }
      }; break;
      case 'game': {
        if (this.game) {
          differences = this.game.differences(value);
        }
      }; break;
      case 'user': {
        if (this.user) {
          differences = this.user.differences(value);
        }
      }; break;
      default: {
        return super.difference.call(this, key, value);
      };
    }
    if (differences) {
      return [true, differences];
    }
    return [false, null];
  }

  mergeValue(key: string, value: any): void {
    if (value !== undefined) {
      switch (key) {
        case 'activities': {
          this.activities.clear();
          for (let i = 0; i < value.length; i++) {
            const activity = new PresenceActivity(this, value[i]);
            if (activity.id) {
              this.activities.set(activity.id, activity);
            } else {
              this.activities.set(i, activity);
            }
          }
        }; return;
        case 'client_status': {
          value = new PresenceClientStatus(this, value);
        }; break;
        case 'game': {
          if (value) {
            if (Object.keys(value).length) {
              if (value.id) {
                if (this.activities.has(value.id)) {
                  value = <PresenceActivity> this.activities.get(value.id);
                } else {
                  value = new PresenceActivity(this, value);
                }
              }
            } else {
              value = undefined;
            }
          }
        }; break;
        case 'user': {
          let user: User;
          if (this.client.users.has(value.id)) {
            user = <User> this.client.users.get(value.id);
            user.merge(value);
          } else {
            user = new User(this.client, value);
            this.client.users.insert(user);
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


const keysPresenceActivity: ReadonlyArray<string> = [
  'application_id',
  'assets',
  'created_at',
  'details',
  'flags',
  'id',
  'instance',
  'metadata',
  'name',
  'party',
  'platform',
  'secrets',
  'session_id',
  'state',
  'sync_id',
  'timestamps',
  'type',
  'url',
];

/**
 * Presence Activity Structure, used in [Presence]
 * @category Structure
 */
export class PresenceActivity extends BaseStructure {
  readonly _keys = keysPresenceActivity;
  presence: Presence;

  applicationId?: string;
  assets?: PresenceActivityAssets;
  createdAt?: number;
  details?: string;
  flags: number = 0;
  id?: string;
  instance?: boolean;
  metadata?: any;
  name: string = '';
  party?: PresenceActivityParty;
  platform?: string;
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
    Object.defineProperty(this, 'presence', {enumerable: false, writable: false});
    this.merge(data);
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

  difference(key: string, value: any): [boolean, any] {
    let differences: any;
    switch (key) {
      case 'assets': {
        if (this.assets) {
          differences = this.assets.differences(value);
        }
      }; break;
      case 'party': {
        if (this.party) {
          differences = this.party.differences(value);
        }
      }; break;
      case 'secrets': {
        if (this.secrets) {
          differences = this.secrets.differences(value);
        }
      }; break;
      case 'timestamps': {
        if (this.timestamps) {
          differences = this.timestamps.differences(value);
        }
      }; break;
      default: {
        return super.difference.call(this, key, value);
      };
    }
    if (differences) {
      return [true, differences];
    }
    return [false, differences];
  }

  mergeValue(key: string, value: any): void {
    if (value !== null) {
      // just replace our objects since they're of new values
      if (typeof(value) === 'object') {
        if (Object.keys(value).length) {
          switch (key) {
            case 'assets': {
              value = new PresenceActivityAssets(this, value);
            }; break;
            case 'party': {
              value = new PresenceActivityParty(this, value);
            }; break;
            case 'secrets': {
              value = new PresenceActivitySecrets(this, value);
            }; break;
            case 'timestamps': {
              value = new PresenceActivityTimestamps(this, value);
            }; break;
          }
        } else {
          value = undefined;
        }
      }
    }
    return super.mergeValue.call(this, key, value);
  }

  toString(): string {
    return `${this.typeText} ${this.name}`;
  }
}


const keysPresenceActivityAssets: ReadonlyArray<string> = [
  'large_image',
  'large_text',
  'small_image',
  'small_text',
];

/**
 * Presence Activity Assets Structure, used in [PresenceActivity]
 * @category Structure
 */
export class PresenceActivityAssets extends BaseStructure {
  readonly _keys = keysPresenceActivityAssets;
  activity: PresenceActivity;

  largeImage?: string;
  largeText?: string;
  smallImage?: string;
  smallText?: string;

  constructor(activity: PresenceActivity, data: BaseStructureData) {
    super(activity.client);
    this.activity = activity;
    Object.defineProperty(this, 'activity', {enumerable: false, writable: false});
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
}


const keysPresenceActivityParty: ReadonlyArray<string> = [
  'id',
  'size',
];

/**
 * Presence Activity Party Structure, used in [PresenceActivity]
 * describe's the user's current party (listening party, game party, etc..)
 * @category Structure
 */
export class PresenceActivityParty extends BaseStructure {
  readonly _keys = keysPresenceActivityParty;
  activity: PresenceActivity;

  id?: string;
  size?: [number, number];

  constructor(activity: PresenceActivity, data: BaseStructureData) {
    super(activity.client);
    this.activity = activity;
    Object.defineProperty(this, 'activity', {enumerable: false, writable: false});
    this.merge(data);
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

      for (let [cacheId, cache] of this.client.presences) {
        for (let [userId, presence] of cache) {
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
          // maybe store this userId in a cache of already checked userIds
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
}


const keysPresenceActivitySecrets: ReadonlyArray<string> = [
  'join',
  'match',
  'spectate',
];

/**
 * Presence Activity Secrets Structure
 * used to join someone's game
 * @category Structure
 */
export class PresenceActivitySecrets extends BaseStructure {
  readonly _keys = keysPresenceActivitySecrets;
  activity: PresenceActivity;

  join?: string;
  match?: string;
  spectate?: string;

  constructor(activity: PresenceActivity, data: BaseStructureData) {
    super(activity.client);
    this.activity = activity;
    Object.defineProperty(this, 'activity', {enumerable: false, writable: false});
    this.merge(data);
  }
}


const keysPresenceActivityTimestamps: ReadonlyArray<string> = [
  'end',
  'start',
];

/**
 * Presence Activity Timestamp Structure
 * used to describe when they started doing an activity and if they ended it or not
 * @category Structure
 */
export class PresenceActivityTimestamps extends BaseStructure {
  readonly _keys = keysPresenceActivityTimestamps;
  activity: PresenceActivity;

  end?: number;
  start: number = 0;

  constructor(activity: PresenceActivity, data: BaseStructureData) {
    super(activity.client);
    this.activity = activity;
    Object.defineProperty(this, 'activity', {enumerable: false, writable: false});
    this.merge(data);
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
}


const keysPresenceClientStatus: ReadonlyArray<string> = [
  'desktop',
  'mobile',
  'web',
];

/**
 * Presence Client Status Structure, used in [Presence]
 * used to describe if a person is on desktop, mobile, web, etc..
 * @category Structure
 */
export class PresenceClientStatus extends BaseStructure {
  readonly _keys = keysPresenceClientStatus;
  presence: Presence;

  desktop?: string;
  mobile?: string;
  web?: string;

  constructor(presence: Presence, data: BaseStructureData) {
    super(presence.client);
    this.presence = presence;
    Object.defineProperty(this, 'presence', {enumerable: false, writable: false});
    this.merge(data);
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
}
