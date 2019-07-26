import {
  BaseClientCollection,
  BaseClientCollectionOptions,
} from './basecollection';

import { VoiceConnection } from '../media/voiceconnection';


export interface VoiceConnectionsOptions extends BaseClientCollectionOptions {};

export class VoiceConnections extends BaseClientCollection<string, VoiceConnection> {
  insert(connection: VoiceConnection): void {
    if (this.enabled) {
      this.set(connection.serverId, connection);
    }
  }

  toString(): string {
    return `${this.size} VoiceConnections`;
  }
}
