import {
  BaseClientCollection,
  BaseClientCollectionOptions,
} from './basecollection';

import { Application } from '../structures/application';


export interface ApplicationsOptions extends BaseClientCollectionOptions {};

/**
 * Applications Collection
 * @category Collections
 */
export class Applications extends BaseClientCollection<string, Application> {
  insert(application: Application): void {
    if (this.enabled) {
      this.set(application.id, application);
    }
  }

  async fill(): Promise<void> {
    if (this.enabled) {
      this.clear();
      const applications = await this.client.rest.fetchApplications();
      for (let [applicationId, application] of applications) {
        this.insert(application);
      }
    }
  }

  toString(): string {
    return `${this.size} Applications`;
  }
}
