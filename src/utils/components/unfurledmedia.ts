import { BaseSet } from '../../collections/baseset';
import { DetritusKeys, DiscordKeys } from '../../constants';
import { BaseStructureData, Structure } from '../../structures/basestructure';


export interface ComponentUnfurledMediaData {
  url?: string,
}


const keysComponentUnfurledMedia = new BaseSet<string>([
  DiscordKeys.URL,
]);

/**
 * Utils Component Unfurled Media Structure
 * @category Utils
 */
 export class ComponentUnfurledMedia extends Structure {
  readonly _keys = keysComponentUnfurledMedia;

  url: string = '';

  constructor(data: ComponentUnfurledMediaData = {}) {
    super();
    this.merge(data);
  }

  setUrl(url: string): this {
    this.merge({url});
    return this;
  }

  merge(data?: BaseStructureData): void {
    if (!data) {
      return;
    }

    if (DiscordKeys.URL in data) {
      (this as any)[DetritusKeys[DiscordKeys.URL]] = data[DiscordKeys.URL];
    }
  }
}
