import {
  BaseClientCollection,
  BaseClientCollectionOptions,
} from './basecollection';

import { ClusterIPCOpCodes } from '../constants';
import { Emoji } from '../structures/emoji';


/**
 * @category Collection Options
 */
export interface ApplicationEmojisOptions extends BaseClientCollectionOptions {};

/**
 * Application Emojis Collection
 * @category Collections
 */
export class ApplicationEmojis extends BaseClientCollection<string, Emoji> {
  lastRefresh = 0;
  refreshTime = 4 * (60 * 60) * 1000;
  // 4 hours minimum in between application emojis fetches

  get shouldRefresh(): boolean {
    return !this.length || this.refreshTime <= Date.now() - this.lastRefresh;
  }

  insert(emoji: Emoji): void {
	  if (this.enabled && emoji.id) {
	    this.set(emoji.id, emoji);
	  }
  }

  async fill(force?: {items: Array<any>} | boolean): Promise<void> {
    if (this.enabled) {
      let data: {items: Array<any>};
      if (!force || force === true) {
        if (!this.shouldRefresh && !force) {
          return;
        }
        const applicationId = (this.client.isBot) ? this.client.applicationId : null;
        if (!applicationId) {
          return;
        }
        if (this.client.cluster && this.client.cluster.manager && this.client.cluster.manager.hasMultipleClusters) {
          data = await this.client.cluster.manager.sendRestRequest(
            'fetchApplicationEmojis',
            [applicationId],
          ) as {items: Array<any>};
          this.client.cluster.manager.sendIPC(ClusterIPCOpCodes.FILL_APPLICATION_EMOJIS, {data});
        } else {
          data = await this.client.rest.raw.fetchApplicationEmojis(applicationId) as {items: Array<any>};
          if (this.client.cluster) {
            for (let [shardId, shard] of this.client.cluster.shards) {
              if (shard === this.client) {
                continue;
              }
              await shard.applicationEmojis.fill(data);
            }
          }
        }
        this.lastRefresh = Date.now();
      } else {
        data = force;
        this.lastRefresh = Date.now();
      }
      this.clear();
      for (let raw of data.items) {
        const emoji = new Emoji(this.client, raw);
        this.insert(emoji);
      }
    }
  }

  get [Symbol.toStringTag](): string {
	 return `Application Emojis (${this.size.toLocaleString()} items)`;
  }
}
