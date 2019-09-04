import { ShardClient } from '../client';
import { BaseCollection } from '../collections/basecollection';
import { BaseSet } from '../collections/baseset';
import { Snowflake } from '../utils';

import {
  AuditLogActions,
  AuditLogActionTypes,
  AuditLogSubtargetTypes,
  AuditLogTargetTypes,
  AuditLogChangeKeys,
  DiscordKeys,
} from '../constants';

import {
  BaseStructure,
  BaseStructureData,
} from './basestructure';
import { ChannelBase } from './channel';
import { Guild } from './guild';
import { Role } from './role';
import { User } from './user';
import { Webhook } from './webhook';


const keysAuditLog = new BaseSet<string>([
  DiscordKeys.ACTION_TYPE,
  DiscordKeys.CHANGES,
  DiscordKeys.GUILD_ID,
  DiscordKeys.ID,
  DiscordKeys.OPTIONS,
  DiscordKeys.REASON,
  DiscordKeys.TARGET,
  DiscordKeys.TARGET_ID,
  DiscordKeys.USER,
  DiscordKeys.USER_ID,
]);

/**
 * Guild Audit Log
 * @category Structure
 */
export class AuditLog extends BaseStructure {
  readonly _keys = keysAuditLog;

  actionType: number = -1;
  changes = new BaseCollection<string, any>();
  id: string = '';
  guildId: string = '';
  options?: AuditLogOptions;
  reason?: string;
  target?: User | Webhook;
  targetId?: string;
  user?: User;
  userId?: string;

  constructor(client: ShardClient, data: BaseStructureData) {
    super(client);
    this.merge(data);
  }

  get createdAt(): Date {
    return new Date(this.createdAtUnix);
  }

  get createdAtUnix(): number {
    return Snowflake.timestamp(this.id);
  }

  get guild(): Guild | null {
    return this.client.guilds.get(this.guildId) || null;
  }

  mergeValue(key: string, value: any): void {
    if (value !== undefined) {
      switch (key) {
        case DiscordKeys.CHANGES: {
          this.changes.clear();
          for (let raw of value) {
            const change = new AuditLogChange(this, raw);
            this.changes.set(change.key, change);
          }
        }; return;
        case DiscordKeys.OPTIONS: {
          value = new AuditLogOptions(this, value);
        }; break;
      }
      return super.mergeValue.call(this, key, value);
    }
  }
}


const keysAuditLogChange = new BaseSet<string>([
  DiscordKeys.KEY,
  DiscordKeys.NEW_VALUE,
  DiscordKeys.OLD_VALUE,
]);

/**
 * Guild Audit Log Change, used in [[AuditLog]]
 * @category Structure
 */
export class AuditLogChange extends BaseStructure {
  readonly _keys = keysAuditLogChange;
  readonly log: AuditLog;

  key: string = '';
  newValue: any;
  oldValue: any;

  constructor(log: AuditLog, data: BaseStructureData) {
    super(log.client);
    this.log = log;
    this.merge(data);
    Object.defineProperty(this, 'log', {enumerable: false, writable: false});
  }
}


const keysAuditLogOptions = new BaseSet<string>([
  DiscordKeys.CHANNEL,
  DiscordKeys.CHANNEL_ID,
  DiscordKeys.COUNT,
  DiscordKeys.DELETE_MEMBER_DAYS,
  DiscordKeys.ID,
  DiscordKeys.MEMBERS_REMOVED,
  DiscordKeys.SUBTARGET,
  DiscordKeys.TYPE,
]);

/**
 * Guild Audit Log Options, used in [[AuditLog]]
 * @category Structure
 */
export class AuditLogOptions extends BaseStructure {
  readonly _keys = keysAuditLogOptions;
  readonly log: AuditLog;

  channel?: ChannelBase;
  channelId?: string;
  count?: number;
  deleteMemberDays?: number;
  id?: string;
  membersRemoved?: number;
  subtarget?: Role | User;
  type?: number;

  constructor(log: AuditLog, data: BaseStructureData) {
    super(log.client);
    this.log = log;
    this.merge(data);
    Object.defineProperty(this, 'log', {enumerable: false, writable: false});
  }
}
