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
import { ApplicationCommand } from './applicationcommand';
import { AutoModerationRule } from './automoderationrule';
import { ChannelGuildThread } from './channel';
import { Guild } from './guild';
import { GuildScheduledEvent } from './guildscheduledevent';
import { Integration } from './integration';
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
  readonly _uncloneable = true;
  readonly _keys = keysAuditLog;

  actionType!: AuditLogActions;
  changes = new BaseCollection<string, any>();
  id: string = '';
  guildId: string = '';
  options?: AuditLogOptions;
  reason?: string;
  target?: ApplicationCommand | AutoModerationRule | GuildScheduledEvent | Integration | ChannelGuildThread | User | Webhook;
  targetId?: string;
  user?: User;
  userId?: string;

  constructor(client: ShardClient, data: BaseStructureData, isClone?: boolean) {
    super(client, undefined, isClone);
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
      return super.mergeValue(key, value);
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
  readonly _uncloneable = true;
  readonly _keys = keysAuditLogChange;

  readonly log: AuditLog;

  key!: AuditLogChangeKeys;
  newValue: any;
  oldValue: any;

  constructor(log: AuditLog, data: BaseStructureData) {
    super(log.client, undefined, log._clone);
    this.log = log;
    this.merge(data);
    Object.defineProperty(this, 'log', {enumerable: false, writable: false});
  }
}


const keysAuditLogOptions = new BaseSet<string>([
  DiscordKeys.APPLICATION_ID,
  DiscordKeys.AUTO_MODERATION_RULE_NAME,
  DiscordKeys.AUTO_MODERATION_RULE_TRIGGER_TYPE,
  DiscordKeys.CHANNEL_ID,
  DiscordKeys.COUNT,
  DiscordKeys.DELETE_MEMBER_DAYS,
  DiscordKeys.ID,
  DiscordKeys.INTEGRATION_TYPE,
  DiscordKeys.MEMBERS_REMOVED,
  DiscordKeys.MESSAGE_ID,
  DiscordKeys.ROLE_NAME,
  DiscordKeys.TYPE,
]);

/**
 * Guild Audit Log Options, used in [[AuditLog]]
 * @category Structure
 */
export class AuditLogOptions extends BaseStructure {
  readonly _uncloneable = true;
  readonly _keys = keysAuditLogOptions;

  readonly log: AuditLog;

  applicationId?: string;
  autoModerationRuleName?: string;
  autoModerationRuleTriggerType?: string;
  channelId?: string;
  count?: number;
  deleteMemberDays?: number;
  id?: string;
  integrationType?: string;
  membersRemoved?: number;
  messageId?: string;
  roleName?: string;
  type?: string;

  constructor(log: AuditLog, data: BaseStructureData) {
    super(log.client, undefined, log._clone);
    this.log = log;
    this.merge(data);
    Object.defineProperty(this, 'log', {enumerable: false, writable: false});
  }

  mergeValue(key: string, value: any): void {
    if (value !== undefined) {
      switch (key) {
        case DiscordKeys.COUNT:
        case DiscordKeys.DELETE_MEMBER_DAYS:
        case DiscordKeys.MEMBERS_REMOVED: {
          value = parseInt(value);
        }; break;
      }
      return super.mergeValue(key, value);
    }
  }
}
