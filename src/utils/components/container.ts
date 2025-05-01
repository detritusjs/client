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
import { ComponentActionRowData, ComponentActionRow } from './actionrow';
import { ComponentButton } from './button';
import { ComponentFile, ComponentFileData } from './file';
import { ComponentMediaGallery, ComponentMediaGalleryData } from './mediagallery';
import { ComponentSection, ComponentSectionData } from './section';
import { ComponentSeparator, ComponentSeparatorData } from './separator';
import { ComponentTextDisplay, ComponentTextDisplayData } from './textdisplay';


export interface ComponentContainerData {
  accent_color?: number,
  accentColor?: number,
  components?: Array<
    ComponentActionRow | ComponentActionRowData |
    ComponentFile | ComponentFileData |
    ComponentMediaGallery | ComponentMediaGalleryData |
    ComponentSection | ComponentSectionData |
    ComponentSeparator | ComponentSeparatorData |
    ComponentTextDisplay | ComponentTextDisplayData
  >,
  id?: number,
  spoiler?: boolean,
  type?: number,
}

const keysComponentContainer = new BaseSet<string>([
  DiscordKeys.ACCENT_COLOR,
  DiscordKeys.COMPONENTS,
  DiscordKeys.ID,
  DiscordKeys.SPOILER,
  DiscordKeys.TYPE,
]);

/**
 * Utils Component Container Structure
 * @category Utils
 */
 export class ComponentContainer extends Structure {
  readonly _keys = keysComponentContainer;

  accentColor?: number;
  components: Array<ComponentActionRow | ComponentFile | ComponentMediaGallery | ComponentSection | ComponentSeparator | ComponentTextDisplay> = [];
  id?: number;
  spoiler?: boolean;
  type = MessageComponentTypes.CONTAINER;

  constructor(data: ComponentContainerData = {}) {
    super();
    if (DetritusKeys[DiscordKeys.ACCENT_COLOR] in data) {
      (data as any)[DiscordKeys.ACCENT_COLOR] = (data as any)[DetritusKeys[DiscordKeys.ACCENT_COLOR]];
    }
    this.merge(data);
    this.type = MessageComponentTypes.CONTAINER;
  }

  get hasRun(): boolean {
    for (let component of this.components) {
      if (component instanceof ComponentActionRow || component instanceof ComponentSection) {
        const hasRun = component.hasRun;
        if (hasRun) {
          return hasRun;
        }
      }
    }
    return false;
  }

  get isEmpty(): boolean {
    return !this.components.length;
  }

  addActionRow(data: ComponentActionRow | ComponentActionRowData = {}): this {
    if (data instanceof ComponentActionRow) {
      this.components.push(data);
    } else {
      this.createActionRow(data);
    }
    return this;
  }

  addFile(data: ComponentFile | ComponentFileData = {}): this {
    if (data instanceof ComponentFile) {
      this.components.push(data);
    } else {
      this.createFile(data);
    }
    return this;
  }

  addMediaGallery(data: ComponentMediaGallery | ComponentMediaGalleryData = {}): this {
    if (data instanceof ComponentMediaGallery) {
      this.components.push(data);
    } else {
      this.createMediaGallery(data);
    }
    return this;
  }

  addSection(data: ComponentSection | ComponentSectionData = {}): this {
    if (data instanceof ComponentSection) {
      this.components.push(data);
    } else {
      this.createSection(data);
    }
    return this;
  }

  addSeparator(data: ComponentSeparator | ComponentSeparatorData = {}): this {
    if (data instanceof ComponentSeparator) {
      this.components.push(data);
    } else {
      this.createSeparator(data);
    }
    return this;
  }

  addTextDisplay(data: ComponentTextDisplay | ComponentTextDisplayData = {}): this {
    if (data instanceof ComponentTextDisplay) {
      this.components.push(data);
    } else {
      this.createTextDisplay(data);
    }
    return this;
  }

  clear() {
    this.components.length = 0;
  }

  createActionRow(data: ComponentActionRowData = {}): ComponentActionRow {
    const actionRow = new ComponentActionRow(data);
    this.components.push(actionRow);
    return actionRow;
  }

  createFile(data: ComponentFileData = {}): ComponentFile {
    const file = new ComponentFile(data);
    this.components.push(file);
    return file;
  }

  createMediaGallery(data: ComponentMediaGalleryData = {}): ComponentMediaGallery {
    const mediaGallery = new ComponentMediaGallery(data);
    this.components.push(mediaGallery);
    return mediaGallery;
  }

  createSection(data: ComponentSectionData = {}): ComponentSection {
    const section = new ComponentSection(data);
    this.components.push(section);
    return section;
  }

  createSeparator(data: ComponentSeparatorData = {}): ComponentSeparator {
    const separator = new ComponentSeparator(data);
    this.components.push(separator);
    return separator;
  }

  createTextDisplay(data: ComponentTextDisplayData = {}): ComponentTextDisplay {
    const component = new ComponentTextDisplay(data);
    this.addTextDisplay(component);
    return component;
  }

  setAccentColor(value: number): this {
    this.merge({[DiscordKeys.ACCENT_COLOR]: value});
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

    if (DiscordKeys.ACCENT_COLOR in data) {
      (this as any)[DetritusKeys[DiscordKeys.ACCENT_COLOR]] = data[DiscordKeys.ACCENT_COLOR];
    }
    if (DiscordKeys.COMPONENTS in data) {
      const value = data[DiscordKeys.COMPONENTS];

      this.clear();
      for (let raw of value) {
        if (
          raw instanceof ComponentActionRow || raw instanceof ComponentFile ||
          raw instanceof ComponentMediaGallery || raw instanceof ComponentSection ||
          raw instanceof ComponentSeparator || raw instanceof ComponentTextDisplay
        ) {
          this.components.push(raw);
        } else {
          switch (raw.type) {
            case MessageComponentTypes.ACTION_ROW: {
              const component = new ComponentActionRow(raw);
              this.components.push(component);
            }; break;
            case MessageComponentTypes.FILE: {
              const component = new ComponentFile(raw);
              this.components.push(component);
            }; break;
            case MessageComponentTypes.MEDIA_GALLERY: {
              const component = new ComponentMediaGallery(raw);
              this.components.push(component);
            }; break;
            case MessageComponentTypes.SECTION: {
              const component = new ComponentSection(raw);
              this.components.push(component);
            }; break;
            case MessageComponentTypes.SEPARATOR: {
              const component = new ComponentSeparator(raw);
              this.components.push(component);
            }; break;
            case MessageComponentTypes.TEXT_DISPLAY: {
              const component = new ComponentTextDisplay(raw);
              this.components.push(component);
            }; break;
            default: {
              throw new Error(`Unknown component type ${raw.type}`);
            };
          }
        }
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
