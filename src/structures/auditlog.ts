import { ShardClient } from '../client';
import { BaseCollection } from '../collections/basecollection';
import { Snowflake } from '../utils';

import {
  AuditLogActions,
  AuditLogActionTypes,
  AuditLogSubtargetTypes,
  AuditLogTargetTypes,
  AuditLogChangeKeys,
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


const keysAuditLog: ReadonlyArray<string> = [
  'action_type',
  'changes',
  'id',
  'guild_id',
  'options',
  'reason',
  'target',
  'target_id',
  'user',
  'user_id',
];

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
        case 'changes': {
          this.changes.clear();
          for (let raw of value) {
            const change = new AuditLogChange(this, raw);
            this.changes.set(change.key, change);
          }
        }; return;
        case 'options': {
          value = new AuditLogOptions(this, value);
        }; break;
      }
      return super.mergeValue.call(this, key, value);
    }
  }
}


const keysAuditLogChange: ReadonlyArray<string> = [
  'key',
  'new_value',
  'old_value',
];

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


const keysAuditLogOptions: ReadonlyArray<string> = [
  'channel',
  'channel_id',
  'count',
  'delete_member_days',
  'id',
  'members_removed',
  'subtarget',
  'type',
];

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
