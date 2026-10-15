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
  // response message id -> interaction id, so a deleted message can find its interaction without going through all of them
  readonly _responseIds = new Map<string, string>();

  constructor(client: ShardClient, options: InteractionsOptions | boolean = {}) {
    if (typeof(options) === 'boolean') {
      options = {enabled: options};
    }
    super(client, Object.assign({}, defaultsInteractionsCache, options));
    Object.defineProperty(this, '_responseIds', {enumerable: false});
  }

  insert(interaction: Interaction): void {
    if (this.enabled) {
      this.set(interaction.id, interaction);
    }
  }

  setResponseId(interaction: Interaction, messageId: string): void {
    if (interaction.responseId && this._responseIds.get(interaction.responseId) === interaction.id) {
      this._responseIds.delete(interaction.responseId);
    }
    interaction.responseId = messageId;
    if (this.cache.get(interaction.id) === interaction) {
      this._responseIds.set(messageId, interaction.id);
    }
  }

  getByResponseId(messageId: string): Interaction | undefined {
    const interactionId = this._responseIds.get(messageId);
    if (interactionId) {
      return this.cache.get(interactionId);
    }
    return undefined;
  }

  // every removal (delete, expiring, the limit evicting) goes through here
  delete(key: string): boolean {
    const interaction = this.cache.get(key);
    const deleted = super.delete(key);
    if (interaction && interaction.responseId && this._responseIds.get(interaction.responseId) === key) {
      this._responseIds.delete(interaction.responseId);
    }
    return deleted;
  }

  clear(): void {
    super.clear();
    this._responseIds.clear();
  }

  get [Symbol.toStringTag](): string {
    return `Interactions (${this.size.toLocaleString()} items)`;
  }
}
