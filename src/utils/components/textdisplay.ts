import { RequestTypes } from 'detritus-client-rest';

import { BaseSet } from '../../collections/baseset';
import { DetritusKeys, DiscordKeys, MessageComponentTypes } from '../../constants';
import { BaseStructureData, Structure } from '../../structures/basestructure';


export interface ComponentTextDisplayData {
  content?: string,
  id?: number,
  type?: number,
}


const keysComponentTextDisplay = new BaseSet<string>([
  DiscordKeys.CONTENT,
  DiscordKeys.ID,
  DiscordKeys.TYPE,
]);

/**
 * Utils Component Text Display Structure
 * @category Utils
 */
 export class ComponentTextDisplay extends Structure {
  readonly _keys = keysComponentTextDisplay;

  content: string = '';
  id?: number;
  type = MessageComponentTypes.TEXT_DISPLAY;

  constructor(data: ComponentTextDisplayData = {}) {
    super();
    this.merge(data);
    this.type = MessageComponentTypes.TEXT_DISPLAY;
  }

  setContent(content: string): this {
    this.merge({content});
    return this;
  }

  setId(id: number): this {
    this.merge({id});
    return this;
  }

  merge(data?: BaseStructureData): void {
    if (!data) {
      return;
    }

    if (DiscordKeys.CONTENT in data) {
      (this as any)[DetritusKeys[DiscordKeys.CONTENT]] = data[DiscordKeys.CONTENT];
    }
    if (DiscordKeys.ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.ID]] = data[DiscordKeys.ID];
    }
    if (DiscordKeys.TYPE in data) {
      (this as any)[DetritusKeys[DiscordKeys.TYPE]] = data[DiscordKeys.TYPE];
    }
  }

  toJSON(): RequestTypes.RawChannelMessageComponent {
    return super.toJSON() as RequestTypes.RawChannelMessageComponent;
  }
}
