import { RequestTypes } from 'detritus-client-rest';

import { BaseSet } from '../../collections/baseset';
import { DetritusKeys, DiscordKeys, MessageComponentTypes } from '../../constants';
import { BaseStructureData, Structure } from '../../structures/basestructure';


export interface ComponentSeparatorData {
  divider?: boolean,
  id?: number,
  spacing?: number,
  type?: number,
}


const keysComponentSeparator = new BaseSet<string>([
  DiscordKeys.DIVIDER,
  DiscordKeys.ID,
  DiscordKeys.SPACING,
  DiscordKeys.TYPE,
]);

/**
 * Utils Component Separator Structure
 * @category Utils
 */
 export class ComponentSeparator extends Structure {
  readonly _keys = keysComponentSeparator;

  divider?: boolean;
  id?: number;
  spacing?: number;
  type = MessageComponentTypes.SEPARATOR;

  constructor(data: ComponentSeparatorData = {}) {
    super();
    this.merge(data);
    this.type = MessageComponentTypes.SEPARATOR;
  }

  setDivider(divider: boolean): this {
    this.merge({divider});
    return this;
  }

  setId(id: number): this {
    this.merge({id});
    return this;
  }

  setSpacing(spacing: number): this {
    this.merge({spacing});
    return this;
  }

  merge(data?: BaseStructureData): void {
    if (!data) {
      return;
    }

    if (DiscordKeys.DIVIDER in data) {
      (this as any)[DetritusKeys[DiscordKeys.DIVIDER]] = data[DiscordKeys.DIVIDER];
    }
    if (DiscordKeys.ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.ID]] = data[DiscordKeys.ID];
    }
    if (DiscordKeys.SPACING in data) {
      (this as any)[DetritusKeys[DiscordKeys.SPACING]] = data[DiscordKeys.SPACING];
    }
    if (DiscordKeys.TYPE in data) {
      (this as any)[DetritusKeys[DiscordKeys.TYPE]] = data[DiscordKeys.TYPE];
    }
  }

  toJSON(): RequestTypes.RawChannelMessageComponent {
    return super.toJSON() as RequestTypes.RawChannelMessageComponent;
  }
}
