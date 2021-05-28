import {
  BaseClientCollectionOptions,
  BaseClientGuildReferenceCache,
} from './basecollection';

import { DetritusKeys, DiscordKeys } from '../constants';
import { StageInstance } from '../structures/stageinstance';


/**
 * @category Collection Options
 */
export interface StageInstancesOptions extends BaseClientCollectionOptions {
  
};

/**
 * Stage Instances Reference Collection
 * @category Collections
 */
export class StageInstances extends BaseClientGuildReferenceCache<string, StageInstance> {
  key = DetritusKeys[DiscordKeys.STAGE_INSTANCES];

  insert(stageInstance: StageInstance): void {
    if (this.enabled) {
      const guild = stageInstance.guild;
      if (guild) {
        guild.stageInstances.set(stageInstance.id, stageInstance);
      }
    }
  }

  get [Symbol.toStringTag](): string {
    return `Stage Instances (${this.size.toLocaleString()} items)`;
  }
}
