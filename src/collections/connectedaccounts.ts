import {
  BaseClientCollection,
  BaseClientCollectionOptions,
} from './basecollection';

import { ConnectedAccount } from '../structures/connectedaccount';


/**
 * @category Collection Options
 */
export interface ConnectedAccountsOptions extends BaseClientCollectionOptions {};

/**
 * Connected Accounts Collection
 * (Bots cannot fill this)
 * @category Collections
 */
export class ConnectedAccounts extends BaseClientCollection<string, ConnectedAccount> {
  insert(account: ConnectedAccount): void {
    if (this.enabled) {
      this.set(account.key, account);
    }
  }

  async fill(): Promise<void> {
    if (this.enabled) {
      this.clear();
      const accounts = await this.client.rest.fetchMeConnections();
      for (let [key, account] of accounts) {
        this.insert(account);
      }
    }
  }

  get [Symbol.toStringTag](): string {
    return `ConnectedAccounts (${this.size.toLocaleString()} items)`;
  }
}
