import {
  Relationship,
} from '../structures';

import {
  BaseClientCollection,
  BaseClientCollectionOptions,
} from './basecollection';


/**
 * @category Collection Options
 */
export interface RelationshipsOptions extends BaseClientCollectionOptions {};

/**
 * Relationships Collection
 * (Bots cannot fill this)
 * @category Collections
 */
export class Relationships extends BaseClientCollection<string, Relationship> {
  insert(relationship: Relationship): void {
    if (this.enabled) {
      this.set(relationship.id, relationship);
    }
  }

  get [Symbol.toStringTag](): string {
    return `Relationships (${this.size.toLocaleString()} items)`;
  }
}
