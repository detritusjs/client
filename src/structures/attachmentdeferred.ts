import { ShardClient } from '../client';
import { BaseSet } from '../collections/baseset';
import { DetritusKeys, DiscordKeys } from '../constants';

import {
  BaseStructure,
  BaseStructureData,
} from './basestructure';


const keysAttachmentDeferred = new BaseSet<string>([
  DiscordKeys.ID,
  DiscordKeys.UPLOAD_FILENAME,
  DiscordKeys.UPLOAD_URL,
]);

/**
 * Attachment Deferred Structure, used to upload attachments to [Message] or [Interaction] objects
 * @category Structure
 */
export class AttachmentDeferred extends BaseStructure {
  readonly _uncloneable = true;
  readonly _keys = keysAttachmentDeferred;

  id: null | number = null;
  uploadFilename: string = '';
  uploadUrl: string = '';

  constructor(
    client: ShardClient,
    data?: BaseStructureData,
    isClone?: boolean,
  ) {
    super(client, undefined, isClone);
    this.merge(data);
  }

  upload(value: any) {
    return this.client.rest.put({
      body: value,
      headers: {'content-type': 'application/octet-stream'},
      jsonify: false,
      multipart: false,
      url: this.uploadUrl,
    });
  }

  merge(data?: BaseStructureData): void {
    if (!data) {
      return;
    }

    if (DiscordKeys.ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.ID]] = data[DiscordKeys.ID];
    }
    if (DiscordKeys.UPLOAD_FILENAME in data) {
      (this as any)[DetritusKeys[DiscordKeys.UPLOAD_FILENAME]] = data[DiscordKeys.UPLOAD_FILENAME];
    }
    if (DiscordKeys.UPLOAD_URL in data) {
      (this as any)[DetritusKeys[DiscordKeys.UPLOAD_URL]] = data[DiscordKeys.UPLOAD_URL];
    }
  }

  toString(): string {
    return this.uploadFilename;
  }
}
