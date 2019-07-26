import {
  Relationship,
} from '../structures';

import {
  BaseClientCollection,
  BaseClientCollectionOptions,
} from './basecollection';


export interface RelationshipsOptions extends BaseClientCollectionOptions {};

export class Relationships extends BaseClientCollection<string, Relationship> {
  insert(relationship: Relationship): void {
    if (this.enabled) {
      this.set(relationship.id, relationship);
    }
  }

  toString(): string {
    return `${this.size} Relationships`;
  }
}
