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
      const applications = await this.client.rest.fetchApplicationsDetectable();
      for (let [applicationId, application] of applications) {
        this.insert(application);
      }
    }
  }

  get [Symbol.toStringTag](): string {
    return `Applications (${this.size.toLocaleString()} items)`;
  }
}
