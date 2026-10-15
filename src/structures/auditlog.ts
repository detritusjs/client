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
  DetritusKeys,
  DiscordKeys,
} from '../constants';

import {
  BaseStructure,
  BaseStructureData,
  setStructureKeys,
  setStructureUncloneable,
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
  static { setStructureUncloneable(this); }
  static { setStructureKeys(this, '_keys', keysAuditLog); }

  actionType!: AuditLogActions;
  changes = new BaseCollection<string, any>();
  id: string = '';
  guildId: string = '';
  declare options?: AuditLogOptions;
  declare reason?: string;
  declare target?: ApplicationCommand | AutoModerationRule | GuildScheduledEvent | Integration | ChannelGuildThread | User | Webhook;
  declare targetId?: string;
  declare user?: User;
  declare userId?: string;

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

  merge(data?: BaseStructureData): void {
    if (!data) {
      return;
    }

    if (DiscordKeys.ACTION_TYPE in data) {
      (this as any)[DetritusKeys[DiscordKeys.ACTION_TYPE]] = data[DiscordKeys.ACTION_TYPE];
    }
    if (DiscordKeys.CHANGES in data) {
      this.changes.clear();
      for (let raw of data[DiscordKeys.CHANGES]) {
        const change = new AuditLogChange(this, raw);
        this.changes.set(change.key, change);
      }
    }
    if (DiscordKeys.GUILD_ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.GUILD_ID]] = data[DiscordKeys.GUILD_ID];
    }
    if (DiscordKeys.ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.ID]] = data[DiscordKeys.ID];
    }
    if (DiscordKeys.OPTIONS in data) {
      const value = new AuditLogOptions(this, data[DiscordKeys.OPTIONS]);
      (this as any)[DetritusKeys[DiscordKeys.OPTIONS]] = value;
    }
    if (DiscordKeys.REASON in data) {
      (this as any)[DetritusKeys[DiscordKeys.REASON]] = data[DiscordKeys.REASON];
    }
    if (DiscordKeys.TARGET in data) {
      (this as any)[DetritusKeys[DiscordKeys.TARGET]] = data[DiscordKeys.TARGET];
    }
    if (DiscordKeys.TARGET_ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.TARGET_ID]] = data[DiscordKeys.TARGET_ID];
    }
    if (DiscordKeys.USER in data) {
      (this as any)[DetritusKeys[DiscordKeys.USER]] = data[DiscordKeys.USER];
    }
    if (DiscordKeys.USER_ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.USER_ID]] = data[DiscordKeys.USER_ID];
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
  static { setStructureUncloneable(this); }
  static { setStructureKeys(this, '_keys', keysAuditLogChange); }

  declare readonly log: AuditLog;

  key!: AuditLogChangeKeys;
  newValue: any;
  oldValue: any;

  constructor(log: AuditLog, data: BaseStructureData) {
    super(log.client, undefined, log._clone);
    Object.defineProperty(this, 'log', {configurable: true, enumerable: false, writable: false, value: log});
    this.merge(data);
  }

  merge(data?: BaseStructureData): void {
    if (!data) {
      return;
    }

    if (DiscordKeys.KEY in data) {
      (this as any)[DetritusKeys[DiscordKeys.KEY]] = data[DiscordKeys.KEY];
    }
    if (DiscordKeys.NEW_VALUE in data) {
      (this as any)[DetritusKeys[DiscordKeys.NEW_VALUE]] = data[DiscordKeys.NEW_VALUE];
    }
    if (DiscordKeys.OLD_VALUE in data) {
      (this as any)[DetritusKeys[DiscordKeys.OLD_VALUE]] = data[DiscordKeys.OLD_VALUE];
    }
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
  DiscordKeys.STATUS,
  DiscordKeys.TYPE,
]);

/**
 * Guild Audit Log Options, used in [[AuditLog]]
 * @category Structure
 */
export class AuditLogOptions extends BaseStructure {
  static { setStructureUncloneable(this); }
  static { setStructureKeys(this, '_keys', keysAuditLogOptions); }

  declare readonly log: AuditLog;

  declare applicationId?: string;
  declare autoModerationRuleName?: string;
  declare autoModerationRuleTriggerType?: string;
  declare channelId?: string;
  declare count?: number;
  declare deleteMemberDays?: number;
  declare id?: string;
  declare integrationType?: string;
  declare membersRemoved?: number;
  declare messageId?: string;
  declare roleName?: string;
  declare status?: string;
  declare type?: string;

  constructor(log: AuditLog, data: BaseStructureData) {
    super(log.client, undefined, log._clone);
    Object.defineProperty(this, 'log', {configurable: true, enumerable: false, writable: false, value: log});
    this.merge(data);
  }

  merge(data?: BaseStructureData): void {
    if (!data) {
      return;
    }

    if (DiscordKeys.APPLICATION_ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.APPLICATION_ID]] = data[DiscordKeys.APPLICATION_ID];
    }
    if (DiscordKeys.AUTO_MODERATION_RULE_NAME in data) {
      (this as any)[DetritusKeys[DiscordKeys.AUTO_MODERATION_RULE_NAME]] = data[DiscordKeys.AUTO_MODERATION_RULE_NAME];
    }
    if (DiscordKeys.AUTO_MODERATION_RULE_TRIGGER_TYPE in data) {
      (this as any)[DetritusKeys[DiscordKeys.AUTO_MODERATION_RULE_TRIGGER_TYPE]] = data[DiscordKeys.AUTO_MODERATION_RULE_TRIGGER_TYPE];
    }
    if (DiscordKeys.CHANNEL_ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.CHANNEL_ID]] = data[DiscordKeys.CHANNEL_ID];
    }
    if (DiscordKeys.COUNT in data) {
      const value = parseInt(data[DiscordKeys.COUNT]);
      (this as any)[DetritusKeys[DiscordKeys.COUNT]] = value;
    }
    if (DiscordKeys.DELETE_MEMBER_DAYS in data) {
      const value = parseInt(data[DiscordKeys.DELETE_MEMBER_DAYS]);
      (this as any)[DetritusKeys[DiscordKeys.DELETE_MEMBER_DAYS]] = value;
    }
    if (DiscordKeys.ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.ID]] = data[DiscordKeys.ID];
    }
    if (DiscordKeys.INTEGRATION_TYPE in data) {
      (this as any)[DetritusKeys[DiscordKeys.INTEGRATION_TYPE]] = data[DiscordKeys.INTEGRATION_TYPE];
    }
    if (DiscordKeys.MEMBERS_REMOVED in data) {
      const value = parseInt(data[DiscordKeys.MEMBERS_REMOVED]);
      (this as any)[DetritusKeys[DiscordKeys.MEMBERS_REMOVED]] = value;
    }
    if (DiscordKeys.MESSAGE_ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.MESSAGE_ID]] = data[DiscordKeys.MESSAGE_ID];
    }
    if (DiscordKeys.ROLE_NAME in data) {
      (this as any)[DetritusKeys[DiscordKeys.ROLE_NAME]] = data[DiscordKeys.ROLE_NAME];
    }
    if (DiscordKeys.STATUS in data) {
      (this as any)[DetritusKeys[DiscordKeys.STATUS]] = data[DiscordKeys.STATUS];
    }
    if (DiscordKeys.TYPE in data) {
      (this as any)[DetritusKeys[DiscordKeys.TYPE]] = data[DiscordKeys.TYPE];
    }
  }
}
