import {
  BaseClientCollection,
  BaseClientCollectionOptions,
} from './basecollection';

import { Session } from '../structures/session';


/**
 * @category Collection Options
 */
export interface SessionsOptions extends BaseClientCollectionOptions {};

/**
 * Sessions Collection
 * (Bots cannot fill this)
 * @category Collections
 */
export class Sessions extends BaseClientCollection<string, Session> {
  insert(session: Session): void {
    if (this.enabled) {
      this.set(session.sessionId, session);
    }
  }

  get [Symbol.toStringTag](): string {
    return `Sessions (${this.size.toLocaleString()} items)`;
  }
}
