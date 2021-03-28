import { ShardClient } from '../client';
import { BaseCollection, emptyBaseCollection } from '../collections/basecollection';
import { BaseSet } from '../collections/baseset';
import {
  DiscordKeys,
  PresenceStatuses,
  LOCAL_GUILD_ID,
} from '../constants';

import {
  BaseStructure,
  BaseStructureData,
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
  readonly _keys = keysSession
  readonly _keysMerge = keysMergeSession;
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

  mergeValue(key: string, value: any): void {
    if (value !== undefined) {
      switch (key) {
        case DiscordKeys.ACTIVITIES: {
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
        }; return;
        case DiscordKeys.CLIENT_INFO: {
          let clientInfo: SessionClientInfo;
          if (this.clientInfo) {
            clientInfo = this.clientInfo;
            clientInfo.merge(value);
          } else {
            clientInfo = new SessionClientInfo(this, value);
          }
          value = clientInfo;
        }; break;
        case DiscordKeys.GAME: {

        }; return;
      }
      return super.mergeValue(key, value);
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
  readonly _keys = keysSessionClientInfo;
  readonly _keysMerge = keysMergeSessionClientInfo;
  readonly session: Session;

  clientString: string = 'unknown';
  os: string = 'unknown';
  version: number = 0;

  constructor(session: Session, data: BaseStructureData) {
    super(session.client, undefined, session._clone);
    this.session = session;
    this.merge(data);
  }

  mergeValue(key: string, value: any): void {
    switch (key) {
      case DiscordKeys.CLIENT: {
        this.clientString = value;
      }; return;
    }
    return this._setFromSnake(key, value);
  }

  toJSON() {
    const data = super.toJSON() as any;
    data[DiscordKeys.CLIENT] = this.clientString;
    return data;
  }
}
