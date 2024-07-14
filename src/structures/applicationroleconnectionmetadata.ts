import { ShardClient } from '../client';
import { BaseSet } from '../collections/baseset';
import {
  ApplicationRoleConnectionMetadataTypes,
  DetritusKeys,
  DiscordKeys,
} from '../constants';

import {
  BaseStructure,
  BaseStructureData,
} from './basestructure';


const keysApplicationRoleConnectionMetadata = new BaseSet<string>([
  DiscordKeys.DESCRIPTION,
  DiscordKeys.DESCRIPTION_LOCALIZATIONS,
  DiscordKeys.KEY,
  DiscordKeys.NAME,
  DiscordKeys.NAME_LOCALIZATIONS,
  DiscordKeys.TYPE,
]);

/**
 * Application Role Metadata Structure
 * @category Structure
 */
export class ApplicationRoleConnectionMetadata extends BaseStructure {
  readonly _keys = keysApplicationRoleConnectionMetadata;

  description: string = '';
  descriptionLocalizations?: Record<string, string>;
  key: string = '';
  name: string = '';
  nameLocalizations?: Record<string, string>;
  type!: ApplicationRoleConnectionMetadataTypes;

  constructor(client: ShardClient, data: BaseStructureData, isClone?: boolean) {
    super(client, undefined, isClone);
    this.merge(data);
  }

  merge(data?: BaseStructureData): void {
    if (!data) {
      return;
    }

    if (DiscordKeys.DESCRIPTION in data) {
      (this as any)[DetritusKeys[DiscordKeys.DESCRIPTION]] = data[DiscordKeys.DESCRIPTION];
    }
    if (DiscordKeys.DESCRIPTION_LOCALIZATIONS in data) {
      (this as any)[DetritusKeys[DiscordKeys.DESCRIPTION_LOCALIZATIONS]] = data[DiscordKeys.DESCRIPTION_LOCALIZATIONS];
    }
    if (DiscordKeys.KEY in data) {
      (this as any)[DetritusKeys[DiscordKeys.KEY]] = data[DiscordKeys.KEY];
    }
    if (DiscordKeys.NAME in data) {
      (this as any)[DetritusKeys[DiscordKeys.NAME]] = data[DiscordKeys.NAME];
    }
    if (DiscordKeys.NAME_LOCALIZATIONS in data) {
      (this as any)[DetritusKeys[DiscordKeys.NAME_LOCALIZATIONS]] = data[DiscordKeys.NAME_LOCALIZATIONS];
    }
    if (DiscordKeys.TYPE in data) {
      (this as any)[DetritusKeys[DiscordKeys.TYPE]] = data[DiscordKeys.TYPE];
    }
  }
}
