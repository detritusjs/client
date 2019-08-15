import {
  BaseClientCollection,
  BaseClientCollectionOptions,
} from './basecollection';


/**
 * @category Collection Options
 */
export interface SessionsOptions extends BaseClientCollectionOptions {};

/**
 * Sessions Collection
 * (Bots cannot fill this)
 * @category Collections
 */
export class Sessions extends BaseClientCollection<string, any> {
  get [Symbol.toStringTag](): string {
    return `Sessions (${this.size.toLocaleString()} items)`;
  }
}
