import {
  BaseClientCollection,
  BaseClientCollectionOptions,
} from './basecollection';


export interface SessionsOptions extends BaseClientCollectionOptions {};

export class Sessions extends BaseClientCollection<string, any> {
  toString(): string {
    return `${this.size} Sessions`;
  }
}
