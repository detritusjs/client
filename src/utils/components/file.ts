import { RequestTypes } from 'detritus-client-rest';

import { BaseSet } from '../../collections/baseset';
import { DetritusKeys, DiscordKeys, MessageComponentTypes } from '../../constants';
import { BaseStructureData, Structure } from '../../structures/basestructure';

import { ComponentUnfurledMedia, ComponentUnfurledMediaData } from './unfurledmedia';


export interface ComponentFileData {
  file?: ComponentUnfurledMedia | ComponentUnfurledMediaData,
  id?: number,
  spoiler?: boolean,
  type?: number,
}


const keysComponentFile = new BaseSet<string>([
  DiscordKeys.FILE,
  DiscordKeys.ID,
  DiscordKeys.SPOILER,
  DiscordKeys.TYPE,
]);

/**
 * Utils Component File Structure
 * @category Utils
 */
 export class ComponentFile extends Structure {
  readonly _keys = keysComponentFile;

  file = new ComponentUnfurledMedia();
  id?: number;
  spoiler?: boolean;
  type = MessageComponentTypes.FILE;

  constructor(data: ComponentFileData = {}) {
    super();
    this.merge(data);
    this.type = MessageComponentTypes.FILE;
  }

  setFile(file: ComponentUnfurledMedia | ComponentUnfurledMediaData): this {
    this.merge({file});
    return this;
  }

  setId(id: number): this {
    this.merge({id});
    return this;
  }

  setSpoiler(spoiler: boolean): this {
    this.merge({spoiler});
    return this;
  }

  merge(data?: BaseStructureData): void {
    if (!data) {
      return;
    }

    if (DiscordKeys.FILE in data) {
      const value = data[DiscordKeys.FILE];
      if (value instanceof ComponentUnfurledMedia) {
        this.file = value;
      } else {
        this.file.merge(value);
      }
    }
    if (DiscordKeys.ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.ID]] = data[DiscordKeys.ID];
    }
    if (DiscordKeys.SPOILER in data) {
      (this as any)[DetritusKeys[DiscordKeys.SPOILER]] = data[DiscordKeys.SPOILER];
    }
    if (DiscordKeys.TYPE in data) {
      (this as any)[DetritusKeys[DiscordKeys.TYPE]] = data[DiscordKeys.TYPE];
    }
  }

  toJSON(): RequestTypes.RawChannelMessageComponent {
    return super.toJSON() as RequestTypes.RawChannelMessageComponent;
  }
}
