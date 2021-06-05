import { Application } from '../structures/application';

import {
  BaseClientCollection,
  BaseClientCollectionOptions,
} from './basecollection';


export interface ApplicationsOptions extends BaseClientCollectionOptions {};

/**
 * Applications Collection
 * @category Collections
 */
export class Applications extends BaseClientCollection<string, Application> {
  lastRefresh = 0;
  refreshTime = 4 * (60 * 60) * 1000;
  // 4 hours minimum in between application fetches

  get shouldRefresh(): boolean {
    return !this.length || this.refreshTime <= Date.now() - this.lastRefresh;
  }

  insert(application: Application): void {
    if (this.enabled) {
      this.set(application.id, application);
    }
  }

  async fill(applications?: Array<any>): Promise<void> {
    if (this.enabled) {
      if (applications) {
        this.lastRefresh = Date.now();
      } else {
        if (!this.shouldRefresh) {
          return;
        }
        if (this.client.cluster && this.client.cluster.manager) {
          applications = await this.client.cluster.manager.sendRestRequest('fetchApplicationsDetectable') as Array<any>;
        } else {
          applications = await this.client.rest.raw.fetchApplicationsDetectable() as Array<any>;
        }
        this.lastRefresh = Date.now();
      }
      this.clear();
      for (let raw of applications) {
        const application = new Application(this.client, raw);
        this.insert(application);
      }
    }
  }

  get [Symbol.toStringTag](): string {
    return `Applications (${this.size.toLocaleString()} items)`;
  }
}
