import { RequestTypes } from 'detritus-client-rest';

import { BaseCollection } from '../collections/basecollection';
import { BaseSet } from '../collections/baseset';
import { ShardClient } from '../client';
import {
  AutoModerationRuleActionTypes,
  AutoModerationRuleEventTypes,
  AutoModerationRuleKeywordPresetTypes,
  AutoModerationRuleTriggerTypes,
  DetritusKeys,
  DiscordKeys,
} from '../constants';
import { Snowflake } from '../utils';

import {
  BaseStructure,
  BaseStructureData,
} from './basestructure';
import { Guild } from './guild';
import { User } from './user';


const keysAutoModerationRule = new BaseSet<string>([
  DiscordKeys.ACTIONS,
  DiscordKeys.CREATOR_ID,
  DiscordKeys.ENABLED,
  DiscordKeys.EVENT_TYPE,
  DiscordKeys.EXEMPT_CHANNELS,
  DiscordKeys.EXEMPT_ROLES,
  DiscordKeys.GUILD_ID,
  DiscordKeys.ID,
  DiscordKeys.NAME,
  DiscordKeys.TRIGGER_METADATA,
  DiscordKeys.TRIGGER_TYPE,
]);

/**
 * Auto Moderation Rule Structure
 * @category Structure
 */
export class AutoModerationRule extends BaseStructure {
  readonly _keys = keysAutoModerationRule;

  actions = new BaseCollection<number, AutoModerationRuleAction>();
  creatorId: string = '';
  enabled: boolean = false;
  eventType!: AutoModerationRuleEventTypes;
  exemptChannels = new BaseSet<string>();
  exemptRoles = new BaseSet<string>();
  guildId: string = '';
  id: string = '';
  name: string = '';
  triggerMetadata!: AutoModerationRuleTriggerMetadata;
  triggerType!: AutoModerationRuleTriggerTypes;

  constructor(client: ShardClient, data?: BaseStructureData, isClone?: boolean) {
    super(client, undefined, isClone);
    this.merge(data);
  }

  get createdAt(): Date {
    return new Date(this.createdAtUnix);
  }

  get createdAtUnix(): number {
    return Snowflake.timestamp(this.id);
  }

  get creator(): User | null {
    return this.client.users.get(this.creatorId) || null;
  }

  get guild(): Guild | null {
    if (this.guildId) {
      return this.client.guilds.get(this.guildId) || null;
    }
    return null;
  }

  async edit(options: RequestTypes.EditGuildAutoModerationRule) {
    return this.client.rest.editGuildAutoModerationRule(this.guildId, this.id, options);
  }

  async delete(options: RequestTypes.DeleteGuildAutoModerationRule) {
    return this.client.rest.deleteGuildAutoModerationRule(this.guildId, this.id, options);
  }

  merge(data?: BaseStructureData): void {
    if (!data) {
      return;
    }

    if (DiscordKeys.ACTIONS in data) {
      const value = data[DiscordKeys.ACTIONS];

      this.actions.clear();
      for (let i = 0; i < value.length; i++) {
        const action = new AutoModerationRuleAction(this, value[i]);
        this.actions.set(i, action);
      }
    }
    if (DiscordKeys.CREATOR_ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.CREATOR_ID]] = data[DiscordKeys.CREATOR_ID];
    }
    if (DiscordKeys.ENABLED in data) {
      (this as any)[DetritusKeys[DiscordKeys.ENABLED]] = data[DiscordKeys.ENABLED];
    }
    if (DiscordKeys.EVENT_TYPE in data) {
      (this as any)[DetritusKeys[DiscordKeys.EVENT_TYPE]] = data[DiscordKeys.EVENT_TYPE];
    }
    if (DiscordKeys.EXEMPT_CHANNELS in data) {
      this.exemptChannels.clear();
      for (let raw of data[DiscordKeys.EXEMPT_CHANNELS]) {
        this.exemptChannels.add(raw);
      }
    }
    if (DiscordKeys.EXEMPT_ROLES in data) {
      this.exemptRoles.clear();
      for (let raw of data[DiscordKeys.EXEMPT_ROLES]) {
        this.exemptRoles.add(raw);
      }
    }
    if (DiscordKeys.GUILD_ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.GUILD_ID]] = data[DiscordKeys.GUILD_ID];
    }
    if (DiscordKeys.ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.ID]] = data[DiscordKeys.ID];
    }
    if (DiscordKeys.NAME in data) {
      (this as any)[DetritusKeys[DiscordKeys.NAME]] = data[DiscordKeys.NAME];
    }
    if (DiscordKeys.TRIGGER_METADATA in data) {
      const metadata = new AutoModerationRuleTriggerMetadata(this, data[DiscordKeys.TRIGGER_METADATA]);
      (this as any)[DetritusKeys[DiscordKeys.TRIGGER_METADATA]] = metadata;
    }
    if (DiscordKeys.TRIGGER_TYPE in data) {
      (this as any)[DetritusKeys[DiscordKeys.TRIGGER_TYPE]] = data[DiscordKeys.TRIGGER_TYPE];
    }
  }
}



const keysAutoModerationRuleAction = new BaseSet<string>([
  DiscordKeys.METADATA,
  DiscordKeys.TYPE,
]);

/**
 * Auto Moderation Rule Action Structure, used for [AutoModerationRule] Structures
 * @category Structure
 */
export class AutoModerationRuleAction extends BaseStructure {
  readonly _keys = keysAutoModerationRuleAction;

  readonly rule: AutoModerationRule;

  metadata?: AutoModerationRuleActionMetadata;
  type!: AutoModerationRuleActionTypes;

  constructor(rule: AutoModerationRule, data: BaseStructureData) {
    super(rule.client, undefined, rule._clone);
    this.rule = rule;
    this.merge(data);
    Object.defineProperty(this, 'rule', {enumerable: false, writable: false});
  }

  merge(data?: BaseStructureData): void {
    if (!data) {
      return;
    }
  
    if (DiscordKeys.METADATA in data) {
      (this as any)[DetritusKeys[DiscordKeys.METADATA]] = data[DiscordKeys.METADATA];
    }
    if (DiscordKeys.TYPE in data) {
      (this as any)[DetritusKeys[DiscordKeys.TYPE]] = data[DiscordKeys.TYPE];
    }
  }
}



const keysAutoModerationRuleActionMetadata = new BaseSet<string>([
  DiscordKeys.CHANNEL_ID,
  DiscordKeys.CUSTOM_MESSAGE,
  DiscordKeys.DURATION_SECONDS,
]);

/**
 * Auto Moderation Rule Action Metadata Structure, used for [AutoModerationRuleAction] Structures
 * @category Structure
 */
export class AutoModerationRuleActionMetadata extends BaseStructure {
  readonly _keys = keysAutoModerationRuleActionMetadata;

  readonly action: AutoModerationRuleAction;

  channelId: string = '';
  customMessage?: string;
  durationSeconds: number = 0;

  constructor(action: AutoModerationRuleAction, data: BaseStructureData) {
    super(action.client, undefined, action._clone);
    this.action = action;
    this.merge(data);
    Object.defineProperty(this, 'action', {enumerable: false, writable: false});
  }

  merge(data?: BaseStructureData): void {
    if (!data) {
      return;
    }
  
    if (DiscordKeys.CHANNEL_ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.CHANNEL_ID]] = data[DiscordKeys.CHANNEL_ID];
    }
    if (DiscordKeys.CUSTOM_MESSAGE in data) {
      (this as any)[DetritusKeys[DiscordKeys.CUSTOM_MESSAGE]] = data[DiscordKeys.CUSTOM_MESSAGE];
    }
    if (DiscordKeys.DURATION_SECONDS in data) {
      (this as any)[DetritusKeys[DiscordKeys.DURATION_SECONDS]] = data[DiscordKeys.DURATION_SECONDS];
    }
  }
}



const keysAutoModerationRuleTriggerMetadata = new BaseSet<string>([
  DiscordKeys.ALLOW_LIST,
  DiscordKeys.KEYWORD_FILTER,
  DiscordKeys.MENTION_RAID_PROTECTION_ENABLED,
  DiscordKeys.MENTION_TOTAL_LIMIT,
  DiscordKeys.PRESETS,
  DiscordKeys.REGEX_PATTERNS,
]);

/**
 * Auto Moderation Rule Action Structure, used for [AutoModerationRule] Structures
 * @category Structure
 */
export class AutoModerationRuleTriggerMetadata extends BaseStructure {
  readonly _keys = keysAutoModerationRuleTriggerMetadata;

  readonly rule: AutoModerationRule;

  allowList?: BaseSet<string>;
  keywordFilter?: BaseSet<string>;
  mentionRaidProtectionEnabled?: boolean;
  mentionTotalLimit?: number;
  presets?: BaseSet<AutoModerationRuleKeywordPresetTypes>;
  regexPatterns?: BaseSet<string>;

  constructor(rule: AutoModerationRule, data: BaseStructureData) {
    super(rule.client, undefined, rule._clone);
    this.rule = rule;
    this.merge(data);
    Object.defineProperty(this, 'rule', {enumerable: false, writable: false});
  }

  merge(data?: BaseStructureData): void {
    if (!data) {
      return;
    }
  
    if (DiscordKeys.ALLOW_LIST in data) {
      const value = new BaseSet<string>(data[DiscordKeys.ALLOW_LIST]);
      (this as any)[DetritusKeys[DiscordKeys.ALLOW_LIST]] = value;
    }
    if (DiscordKeys.KEYWORD_FILTER in data) {
      const value = new BaseSet<string>(data[DiscordKeys.KEYWORD_FILTER]);
      (this as any)[DetritusKeys[DiscordKeys.KEYWORD_FILTER]] = value;
    }
    if (DiscordKeys.MENTION_RAID_PROTECTION_ENABLED in data) {
      (this as any)[DetritusKeys[DiscordKeys.MENTION_RAID_PROTECTION_ENABLED]] = data[DiscordKeys.MENTION_RAID_PROTECTION_ENABLED];
    }
    if (DiscordKeys.MENTION_TOTAL_LIMIT in data) {
      (this as any)[DetritusKeys[DiscordKeys.MENTION_TOTAL_LIMIT]] = data[DiscordKeys.MENTION_TOTAL_LIMIT];
    }
    if (DiscordKeys.PRESETS in data) {
      const value = new BaseSet<AutoModerationRuleKeywordPresetTypes>(data[DiscordKeys.PRESETS]);
      (this as any)[DetritusKeys[DiscordKeys.PRESETS]] = value;
    }
    if (DiscordKeys.REGEX_PATTERNS in data) {
      const value = new BaseSet<string>(data[DiscordKeys.REGEX_PATTERNS]);
      (this as any)[DetritusKeys[DiscordKeys.REGEX_PATTERNS]] = value;
    }
  }
}
