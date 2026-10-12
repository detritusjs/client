import {
  BaseClientCollectionOptions,
  BaseClientGuildReferenceCache,
} from './basecollection';

import { DetritusKeys, DiscordKeys } from '../constants';
import { AutoModerationRule } from '../structures/automoderationrule';


/**
 * @category Collection Options
 */
export interface AutoModerationRulesOptions extends BaseClientCollectionOptions {

};

/**
 * Guild Auto Moderation Rules Reference Collection
 * rules aren't sent in `GUILD_CREATE`, so this only fills from the rule events and `Guild.fetchAutoModerationRules()`
 * @category Collections
 */
export class AutoModerationRules extends BaseClientGuildReferenceCache<string, AutoModerationRule> {
  key = DetritusKeys[DiscordKeys.AUTO_MODERATION_RULES];

  insert(rule: AutoModerationRule): void {
    if (this.enabled) {
      const guild = rule.guild;
      if (guild) {
        guild.autoModerationRules.set(rule.id, rule);
      }
    }
  }

  get [Symbol.toStringTag](): string {
    return `AutoModerationRules (${this.size.toLocaleString()} items)`;
  }
}
