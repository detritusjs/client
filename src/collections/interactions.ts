import { ShardClient } from '../client';
import { INTERACTION_TIMEOUT } from '../constants';
import { Interaction } from '../structures';

import {
  BaseClientCollection,
  BaseClientCollectionOptions,
} from './basecollection';


/**
 * @category Collection Options
 */
export interface InteractionsOptions extends BaseClientCollectionOptions {

};


const defaultsInteractionsCache: InteractionsOptions = Object.freeze({
  expire: INTERACTION_TIMEOUT,
});

/**
 * Interactions Collection
 * @category Collections
 */
export class Interactions extends BaseClientCollection<string, Interaction> {
  constructor(client: ShardClient, options: InteractionsOptions | boolean = {}) {
    if (typeof(options) === 'boolean') {
      options = {enabled: options};
    }
    super(client, Object.assign({}, defaultsInteractionsCache, options));
  }

  insert(interaction: Interaction): void {
    if (this.enabled) {
      this.set(interaction.id, interaction);
    }
  }

  get [Symbol.toStringTag](): string {
    return `Interactions (${this.size.toLocaleString()} items)`;
  }
}
