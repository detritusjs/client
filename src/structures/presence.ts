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
import {
  ImageFormats,
  PlatformTypes,
} from '../constants';

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


const keys = [
  'activities',
  'client_status',
  'game',
  'guild_id',
  'last_modified',
  'status',
  'user',
];

const skipKeys = ['activities'];

export class Presence extends BaseStructure {
  _defaultKeys = keys;
  activities = new BaseCollection<number | string, PresenceActivity>();
  clientStatus?: PresenceClientStatus;
  game: null | PresenceActivity = null;
  guildId: string = '';
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

  get cacheId(): string {
    return this.guildId || DEFAULT_PRESENCE_CACHE_KEY;
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

  merge(data: BaseStructureData): void {
    if (data.activities !== undefined) {
      // merge this first since game might include an id
      this.mergeValue('activities', data.activities);
    }
    return super.merge.call(this, data, skipKeys);
  }

  mergeValue(key: string, value: any): void {
    if (value !== undefined) {
      switch (key) {
        case 'activities': {
          this.activities.clear();
          for (let i = 0; i < value.length; i++) {
            const activity = new PresenceActivity(this, value[i]);
            if (activity.id !== undefined) {
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
              if (value.id !== undefined) {
                if (this.activities.has(value.id)) {
                  value = <PresenceActivity> this.activities.get(value.id);
                } else {
                  value = new PresenceActivity(this, value);
                }
              }
            } else {
              value = null;
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


const keysPresenceActivity = [
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

export class PresenceActivity extends BaseStructure {
  _defaultKeys = keysPresenceActivity;
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
    if (this.applicationId !== undefined) {
      return this.client.applications.get(this.applicationId) || null;
    }
    return null;
  }

  get group(): BaseCollection<string, User> | null {
    if (this.party !== undefined) {
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

  imageUrlFormat(format?: string): null | string {
    if (this.assets !== undefined) {
      return this.assets.imageUrlFormat(format);
    }
    const application = this.application;
    if (application !== null) {
      return application.iconUrlFormat(format);
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
    if (value === null || value === null) {
      return;
    }
    // just replace our objects since they're of new values
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
    return super.mergeValue.call(this, key, value);
  }

  toString(): string {
    return `${this.typeText} ${this.name}`;
  }
}


const keysPresenceActivityAssets = [
  'large_image',
  'large_text',
  'small_image',
  'small_text',
];

export class PresenceActivityAssets extends BaseStructure {
  _defaultKeys = keysPresenceActivityAssets;
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
    format?: string,
    size?: number | [number, number],
    hash?: null | string,
  ): null | string {
    if (hash === undefined) {
      hash = this.largeImage || this.smallImage || null;
    }
    if (hash === null) {
      return null;
    }
    if (format === undefined) {
      format = this.client.imageFormat || ImageFormats.PNG;
    }
    const valid = [
      ImageFormats.JPEG,
      ImageFormats.JPG,
      ImageFormats.PNG,
      ImageFormats.WEBP,
    ];
    if (!valid.includes(format)) {
      throw new Error(`Invalid format: '${format}', valid: ${JSON.stringify(valid)}`);
    }

    if (hash.includes(':')) {
      const [platform, id] = hash.split(':');
      switch (platform) {
        case PlatformTypes.SPOTIFY: {
          return Endpoints.CDN.CUSTOM_SPOTIFY(id);
        };
        case PlatformTypes.TWITCH: {
          let height = ImageSizes.LARGE;
          let width = ImageSizes.SMALL;
          if (size !== undefined) {
            if (Array.isArray(size)) {
              [height, width] = size;
            } else {
              height = size;
              width = size;
            }
          }
          if (size === undefined) {
            size = ImageSizes.LARGE;
          }
          return Endpoints.CDN.CUSTOM_TWITCH(id, height, width);
        };
      }
    } else {
      // treat it as a normal hash
      let query = '';
      if (size !== undefined) {
        if (Array.isArray(size)) {
          query = `?size=${encodeURIComponent(size[0])}`;
        } else {
          query = `?size=${encodeURIComponent(size)}`;
        }
      }
      return Endpoints.CDN.APP_ASSETS(this.activity.applicationId, hash, format) + query;
    }
    return null;
  }

  largeImageUrlFormat(format?: string, size?: number | [number, number]) {
    return this.imageUrlFormat(format, size, this.largeImage || null);
  }

  smallImageUrlFormat(format?: string, size?: number | [number, number]) {
    return this.imageUrlFormat(format, size, this.smallImage || null);
  }
}


const keysPresenceActivityParty = [
  'id',
  'size',
];

export class PresenceActivityParty extends BaseStructure {
  _defaultKeys = keysPresenceActivityParty;
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
      for (let [cacheId, cache] of this.client.presences) {
        for (let [userId, presence] of cache) {
          if (presence.game && presence.game.party) {
            if (this.id === presence.game.party.id) {
              group.set(userId, presence.user);
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
}


const keysPresenceActivitySecrets = [
  'join',
  'match',
  'spectate',
];

export class PresenceActivitySecrets extends BaseStructure {
  _defaultKeys = keysPresenceActivitySecrets;
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


const keysPresenceActivityTimestamps = [
  'end',
  'start',
];

export class PresenceActivityTimestamps extends BaseStructure {
  _defaultKeys = keysPresenceActivityTimestamps;
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
    const elapsed = Date.now() - this.start;
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


const keysPresenceClientStatus = [
  'desktop',
  'mobile',
  'web',
];

export class PresenceClientStatus extends BaseStructure {
  _defaultKeys = keysPresenceClientStatus;
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
