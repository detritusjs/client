import { RequestTypes } from 'detritus-client-rest';
import { Timers } from 'detritus-utils';

import { BaseSet } from '../../collections/baseset';
import { DetritusKeys, DiscordKeys, MessageComponentTypes } from '../../constants';
import { BaseStructureData, Structure } from '../../structures/basestructure';

import { ComponentActionData } from './actionbase';
import { ComponentActionRowData, ComponentActionRow } from './actionrow';
import { ComponentButton } from './button';
import { ComponentContainer, ComponentContainerData } from './container';
import { ComponentContext } from './context';
import { ComponentFile, ComponentFileData } from './file';
import { ComponentInputText } from './inputtext';
import { ComponentMediaGallery, ComponentMediaGalleryData } from './mediagallery';
import { ComponentSection, ComponentSectionData } from './section';
import { ComponentSelectMenu } from './selectmenu';
import { ComponentSeparator, ComponentSeparatorData } from './separator';
import { ComponentTextDisplay, ComponentTextDisplayData } from './textdisplay';


export type ComponentOnTimeout = () => Promise<any> | any;
export type ComponentRun = (context: ComponentContext) => Promise<any> | any;
export type ComponentOnError = (context: ComponentContext, error: Error) => Promise<any> | any;


export interface ComponentsOptions {
  components?: Array<
    ComponentActionRow | ComponentActionRowData |
    ComponentContainer | ComponentContainerData |
    ComponentFile | ComponentFileData |
    ComponentMediaGallery | ComponentMediaGalleryData |
    ComponentSection | ComponentSectionData |
    ComponentSeparator | ComponentSeparatorData |
    ComponentTextDisplay | ComponentTextDisplayData
  >,
  id?: string,
  timeout?: number,

  onTimeout?: ComponentOnTimeout,
  run?: ComponentRun,
  onError?: ComponentOnError,
}

const keysComponents = new BaseSet<string>([
  DiscordKeys.COMPONENTS,
  DiscordKeys.ID,
  DiscordKeys.TIMEOUT,
]);

/**
 * Utils Components Structure
 * @category Utils
 */
export class Components extends Structure {
  readonly _keys = keysComponents;
  _timeout?: Timers.Timeout;

  components: Array<ComponentActionRow | ComponentContainer | ComponentFile | ComponentMediaGallery | ComponentSection | ComponentSeparator | ComponentTextDisplay> = [];
  id?: string;
  timeout: number = 10 * (60 * 1000); // 10 minutes

  onTimeout?(): Promise<any> | any;
  run?(context: ComponentContext): Promise<any> | any;
  onError?(context: ComponentContext, error: Error): Promise<any> | any;

  constructor(data: ComponentsOptions = {}) {
    super();
    this.merge(data);
    this.run = data.run || this.run;
    this.onError = data.onError || this.onError;
    this.onTimeout = data.onTimeout || this.onTimeout;
  }

  get isV2(): boolean {
    // add a check to see how many top-level components there are, if more than 5 then it is v2
    for (let component of this.components) {
      switch (component.type) {
        case MessageComponentTypes.CONTAINER: return true;
        case MessageComponentTypes.FILE: return true;
        case MessageComponentTypes.MEDIA_GALLERY: return true;
        case MessageComponentTypes.SECTION: return true;
        case MessageComponentTypes.SEPARATOR: return true;
        case MessageComponentTypes.TEXT_DISPLAY: return true;
      }
    }
    return false;
  }

  get length(): number {
    return this.components.length;
  }

  addActionRow(data: ComponentActionRow | ComponentActionRowData = {}): this {
    if (data instanceof ComponentActionRow) {
      this.components.push(data);
    } else {
      this.createActionRow(data);
    }
    return this;
  }

  addButton(data: ComponentButton | ComponentActionData = {}, inline = true): this {
    let actionRow: ComponentActionRow;
    if (inline) {
      actionRow = (this.components.find((row) => {
        return row instanceof ComponentActionRow && (row.isEmpty || !row.isFull);
      }) as ComponentActionRow | undefined) || this.createActionRow();
    } else {
      actionRow = this.createActionRow();
    }
    actionRow.addButton(data);
    return this;
  }

  addContainer(data: ComponentContainer | ComponentContainerData = {}): this {
    if (data instanceof ComponentContainer) {
      this.components.push(data);
    } else {
      this.createContainer(data);
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

  addInputText(data: ComponentInputText | ComponentActionData = {}): this {
    const actionRow = this.createActionRow();
    actionRow.addInputText(data);
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

  addSelectMenu(data: ComponentSelectMenu | ComponentActionData = {}): this {
    const actionRow = this.createActionRow();
    actionRow.addSelectMenu(data);
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

  createButton(data: ComponentActionData = {}, inline = true): ComponentButton {
    let actionRow: ComponentActionRow;
    if (inline) {
      actionRow = (this.components.find((row) => {
        return row instanceof ComponentActionRow && (row.isEmpty || !row.isFull);
      }) as ComponentActionRow | undefined) || this.createActionRow();
    } else {
      actionRow = this.createActionRow();
    }
    return actionRow.createButton(data);
  }

  createContainer(data: ComponentContainerData = {}): ComponentContainer {
    const container = new ComponentContainer(data);
    this.components.push(container);
    return container;
  }

  createFile(data: ComponentFileData = {}): ComponentFile {
    const file = new ComponentFile(data);
    this.components.push(file);
    return file;
  }

  createInputText(data: ComponentActionData = {}): ComponentInputText {
    const actionRow = this.createActionRow();
    return actionRow.createInputText(data);
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

  createSelectMenu(data: ComponentActionData = {}): ComponentSelectMenu {
    const actionRow = this.createActionRow();
    return actionRow.createSelectMenu(data);
  }

  createSeparator(data: ComponentSeparatorData = {}): ComponentSeparator {
    const separator = new ComponentSeparator(data);
    this.components.push(separator);
    return separator;
  }

  createTextDisplay(data: ComponentTextDisplayData = {}): ComponentTextDisplay {
    const textDisplay = new ComponentTextDisplay(data);
    this.components.push(textDisplay);
    return textDisplay;
  }

  merge(data?: BaseStructureData): void {
    if (!data) {
      return;
    }

    if (DiscordKeys.COMPONENTS in data) {
      const value = data[DiscordKeys.COMPONENTS];

      this.clear();
      for (let raw of value) {
        if (
          raw instanceof ComponentActionRow || raw instanceof ComponentContainer ||
          raw instanceof ComponentFile || raw instanceof ComponentMediaGallery ||
          raw instanceof ComponentSection || raw instanceof ComponentSeparator ||
          raw instanceof ComponentTextDisplay
        ) {
          this.components.push(raw);
        } else {
          switch (raw.type) {
            case MessageComponentTypes.ACTION_ROW: {
              const component = new ComponentActionRow(raw);
              this.components.push(component);
            }; break;
            case MessageComponentTypes.CONTAINER: {
              const component = new ComponentContainer(raw);
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
    if (DiscordKeys.TIMEOUT in data) {
      (this as any)[DetritusKeys[DiscordKeys.TIMEOUT]] = data[DiscordKeys.TIMEOUT];
    }
  }

  toJSON(): Array<RequestTypes.RawChannelMessageComponent> {
    return this.components.map((component) => component.toJSON());
  }
}
