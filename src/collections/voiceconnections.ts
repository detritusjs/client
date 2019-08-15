import {
  BaseClientCollection,
  BaseClientCollectionOptions,
} from './basecollection';

import { VoiceConnection } from '../media/voiceconnection';


export interface VoiceConnectionsOptions extends BaseClientCollectionOptions {
  
};


/**
 * VoiceConnections Collection
 * @category Collections
 */
export class VoiceConnections extends BaseClientCollection<string, VoiceConnection> {
  insert(connection: VoiceConnection): void {
    if (this.enabled) {
      this.set(connection.serverId, connection);
    }
  }

  get [Symbol.toStringTag](): string {
    return `VoiceConnections (${this.size.toLocaleString()} items)`;
  }
}
