import {
  BaseClientCollectionOptions,
  BaseClientGuildReferenceCache,
} from './basecollection';

import { DetritusKeys, DiscordKeys } from '../constants';
import { Member } from '../structures';


/**
 * @category Collection Options
 */
export interface MembersOptions extends BaseClientCollectionOptions {

};

/**
 * Members Collection
 * @category Collections
 */
export class Members extends BaseClientGuildReferenceCache<string, Member> {
  key = DetritusKeys[DiscordKeys.MEMBERS];

  insert(member: Member): void {
    const guild = member.guild;
    if (guild) {
      if (member.isMe) {
        guild.members.set(member.id, member);
      } else {
        if (this.enabled) {
          guild.members.set(member.id, member);
        }
      }
    }
  }

  get [Symbol.toStringTag](): string {
    return `Members (${this.size.toLocaleString()} items)`;
  }
}
