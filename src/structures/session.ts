import { ShardClient } from '../client';
import { BaseCollection, emptyBaseCollection } from '../collections/basecollection';
import { BaseSet } from '../collections/baseset';
import {
  DetritusKeys,
  DiscordKeys,
  PresenceStatuses,
  LOCAL_GUILD_ID,
} from '../constants';

import {
  BaseStructure,
  BaseStructureData,
  setStructureKeys,
} from './basestructure';
import { PresenceActivity } from './presence';
import { User } from './user';


const keysSession = new BaseSet<string>([
  DiscordKeys.ACTIVE,
  DiscordKeys.ACTIVITIES,
  DiscordKeys.CLIENT_INFO,
  DiscordKeys.GAME,
  DiscordKeys.POSITION,
  DiscordKeys.SESSION_ID,
  DiscordKeys.STATUS,
]);

const keysMergeSession = new BaseSet<string>([
  DiscordKeys.ACTIVITIES,
]);

/**
 * Discord Session Structure (Users Only)
 * @category Structure
 */
export class Session extends BaseStructure {
  static { setStructureKeys(this, '_keys', keysSession); }
  static { setStructureKeys(this, '_keysMerge', keysMergeSession); }
  _activities?: BaseCollection<string, PresenceActivity>;

  active: boolean = false;
  clientInfo!: SessionClientInfo;
  sessionId: string = 'all';
  status: string = PresenceStatuses.OFFLINE;

  constructor(
    client: ShardClient,
    data?: BaseStructureData,
    isClone?: boolean,
  ) {
    super(client, undefined, isClone);
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

  merge(data?: BaseStructureData): void {
    if (!data) {
      return;
    }

    if (DiscordKeys.ACTIVITIES in data) {
      const value = data[DiscordKeys.ACTIVITIES];
      if (value.length) {
        if (!this._activities) {
          this._activities = new BaseCollection<string, PresenceActivity>();
        }
        this._activities.clear();

        for (let position = 0; position < value.length; position++) {
          const raw = value[position];
          raw.position = position;

          if (this.isClone) {
            const activity = new PresenceActivity((this.client.user as User).clone(), raw);
            this._activities.set(activity.id, activity);
          } else {
            if (this._activities.has(raw.id)) {
              const activity = this._activities.get(raw.id) as PresenceActivity;
              activity.merge(raw);
            } else {
              const activity = new PresenceActivity(this.client.user as User, raw);
              this._activities.set(activity.id, activity);
            }
          }
        }
      } else {
        if (this._activities) {
          this._activities.clear();
          this._activities = undefined;
        }
      }
    }
    if (DiscordKeys.ACTIVE in data) {
      (this as any)[DetritusKeys[DiscordKeys.ACTIVE]] = data[DiscordKeys.ACTIVE];
    }
    if (DiscordKeys.CLIENT_INFO in data) {
      const value = data[DiscordKeys.CLIENT_INFO];

      let clientInfo: SessionClientInfo;
      if (this.clientInfo) {
        clientInfo = this.clientInfo;
        clientInfo.merge(value);
      } else {
        clientInfo = new SessionClientInfo(this, value);
      }
      (this as any)[DetritusKeys[DiscordKeys.CLIENT_INFO]] = clientInfo;
    }
    if (DiscordKeys.POSITION in data) {
      (this as any)[DetritusKeys[DiscordKeys.POSITION]] = data[DiscordKeys.POSITION];
    }
    if (DiscordKeys.SESSION_ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.SESSION_ID]] = data[DiscordKeys.SESSION_ID];
    }
    if (DiscordKeys.STATUS in data) {
      (this as any)[DetritusKeys[DiscordKeys.STATUS]] = data[DiscordKeys.STATUS];
    }
  }
}


const keysSessionClientInfo = new BaseSet<string>([
  DiscordKeys.CLIENT,
  DiscordKeys.OS,
  DiscordKeys.VERSION,
]);

const keysMergeSessionClientInfo = keysSessionClientInfo;

/**
 * Session Client Info Structure, used in [Session]
 * @category Structure
 */
export class SessionClientInfo extends BaseStructure {
  readonly _uncloneable = true;
  static { setStructureKeys(this, '_keys', keysSessionClientInfo); }
  static { setStructureKeys(this, '_keysMerge', keysMergeSessionClientInfo); }
  readonly session: Session;

  clientString: string = 'unknown';
  os: string = 'unknown';
  version: number = 0;

  constructor(session: Session, data: BaseStructureData) {
    super(session.client, undefined, session._clone);
    this.session = session;
    this.merge(data);
  }

  merge(data?: BaseStructureData): void {
    if (!data) {
      return;
    }

    if (DiscordKeys.CLIENT in data) {
      this.clientString = data[DiscordKeys.CLIENT];
    }
    if (DiscordKeys.OS in data) {
      (this as any)[DetritusKeys[DiscordKeys.OS]] = data[DiscordKeys.OS];
    }
    if (DiscordKeys.VERSION in data) {
      (this as any)[DetritusKeys[DiscordKeys.VERSION]] = data[DiscordKeys.VERSION];
    }
  }

  toJSON() {
    const data = super.toJSON() as any;
    data[DiscordKeys.CLIENT] = this.clientString;
    return data;
  }
}
