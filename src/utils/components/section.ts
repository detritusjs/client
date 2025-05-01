import { RequestTypes } from 'detritus-client-rest';

import { BaseSet } from '../../collections/baseset';
import {
  DetritusKeys,
  DiscordKeys,
  MessageComponentTypes,
  MAX_COMPONENTS_SECTION_TEXT_DISPLAYS,
} from '../../constants';
import { BaseStructureData, Structure } from '../../structures/basestructure';

import { ComponentActionData } from './actionbase';
import { ComponentButton } from './button';
import { ComponentTextDisplay, ComponentTextDisplayData } from './textdisplay';
import { ComponentThumbnail, ComponentThumbnailData } from './thumbnail';


export interface ComponentSectionData {
  accessory?: ComponentActionData | ComponentButton,
  components?: Array<ComponentTextDisplay | ComponentTextDisplayData>,
  id?: number,
  type?: number,
}

const keysComponentSection = new BaseSet<string>([
  DiscordKeys.ACCESSORY,
  DiscordKeys.COMPONENTS,
  DiscordKeys.ID,
  DiscordKeys.TYPE,
]);

/**
 * Utils Component Section Structure
 * @category Utils
 */
 export class ComponentSection extends Structure {
  readonly _keys = keysComponentSection;

  accessory?: ComponentButton | ComponentThumbnail;
  components: Array<ComponentTextDisplay> = [];
  id?: number;
  type = MessageComponentTypes.SECTION;

  constructor(data: ComponentSectionData = {}) {
    super();
    this.merge(data);
    this.type = MessageComponentTypes.SECTION;
  }

  get hasButton(): boolean {
    if (this.accessory) {
      return this.accessory.type === MessageComponentTypes.BUTTON;
    }
    return false;
  }

  get hasRun(): boolean {
    if (this.accessory && this.accessory instanceof ComponentButton) {
      return this.accessory.hasRun;
    }
    return false;
  }

  get isEmpty(): boolean {
    return !this.components.length;
  }

  get isFull(): boolean {
    return MAX_COMPONENTS_SECTION_TEXT_DISPLAYS <= this.components.length;
  }

  addTextDisplay(data: ComponentTextDisplay | ComponentTextDisplayData = {}): this {
    if (data instanceof ComponentTextDisplay) {
      this.components.push(data);
    } else {
      this.createTextDisplay(data);
    }
    return this;
  }

  createAccessoryButton(data: ComponentActionData = {}): ComponentButton {
    const component = new ComponentButton(data);
    this.setAccessory(component);
    return component;
  }

  createTextDisplay(data: ComponentTextDisplayData = {}): ComponentTextDisplay {
    const component = new ComponentTextDisplay(data);
    this.addTextDisplay(component);
    return component;
  }

  setAccessory(data: ComponentButton | ComponentActionData | ComponentThumbnail | ComponentThumbnailData = {}): this {
    if (data instanceof ComponentButton || data instanceof ComponentThumbnail) {
      this.accessory = data;
    } else {
      switch (data.type) {
        case MessageComponentTypes.BUTTON: {
          this.accessory = new ComponentButton(data);
        }; break;
        case MessageComponentTypes.THUMBNAIL: {
          this.accessory = new ComponentThumbnail(data);
        }; break;
        default: {
          throw new Error('Must specify either button or thumbnail for accessory');
        };
      }
    }
    return this;
  }

  setAccessoryButton(data: ComponentButton | ComponentActionData = {}): this {
    if (data instanceof ComponentButton) {
      this.accessory = data;
    } else {
      this.accessory = new ComponentButton(data);
    }
    return this;
  }

  setAccessoryThumbnail(data: ComponentThumbnail | ComponentThumbnailData = {}): this {
    if (data instanceof ComponentThumbnail) {
      this.accessory = data;
    } else {
      this.accessory = new ComponentThumbnail(data);
    }
    return this;
  }

  merge(data?: BaseStructureData): void {
    if (!data) {
      return;
    }
  
    if (DiscordKeys.ACCESSORY in data) {
      this.setAccessory(data[DiscordKeys.ACCESSORY]);
    }
    if (DiscordKeys.COMPONENTS in data) {
      const value = data[DiscordKeys.COMPONENTS];

      this.components.length = 0;
      for (let raw of value) {
        this.addTextDisplay(raw);
      }
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
