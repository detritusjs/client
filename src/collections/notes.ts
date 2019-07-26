import {
  BaseClientCollection,
  BaseClientCollectionOptions,
} from './basecollection';


export interface NotesOptions extends BaseClientCollectionOptions {};

export class Notes extends BaseClientCollection<string, string> {
  insert(userId: string, note: string): void {
    if (this.enabled) {
      if (note) {
        this.set(userId, note);
      } else {
        this.delete(userId);
      }
    }
  }

  toString(): string {
    return `${this.size} Notes`;
  }
}
