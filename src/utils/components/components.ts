import { RequestTypes } from 'detritus-client-rest';
import { Timers } from 'detritus-utils';

import { BaseSet } from '../../collections/baseset';
import { DetritusKeys, DiscordKeys, MessageComponentTypes } from '../../constants';
import { BaseStructureData, Structure } from '../../structures/basestructure';

import { ComponentActionData } from './actionbase';
import { ComponentActionRowData, ComponentActionRow } from './actionrow';
import { ComponentButton } from './button';
import { ComponentContext } from './context';
import { ComponentInputText } from './inputtext';
import { ComponentSection, ComponentSectionData } from './section';
import { ComponentSelectMenu } from './selectmenu';
import { ComponentTextDisplay, ComponentTextDisplayData } from './textdisplay';


export type ComponentOnTimeout = () => Promise<any> | any;
export type ComponentRun = (context: ComponentContext) => Promise<any> | any;
export type ComponentOnError = (context: ComponentContext, error: Error) => Promise<any> | any;


export interface ComponentsOptions {
  components?: Array<ComponentActionRow | ComponentActionRowData | ComponentSection | ComponentSectionData | ComponentTextDisplay | ComponentTextDisplayData>,
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

  components: Array<ComponentActionRow | ComponentSection | ComponentTextDisplay> = [];
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
    for (let component of this.components) {
      switch (component.type) {
        case MessageComponentTypes.SECTION: return true;
        case MessageComponentTypes.TEXT_DISPLAY: return true;
      }
    }
    return false;
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

  addInputText(data: ComponentInputText | ComponentActionData = {}): this {
    const actionRow = this.createActionRow();
    actionRow.addInputText(data);
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

  createInputText(data: ComponentActionData = {}): ComponentInputText {
    const actionRow = this.createActionRow();
    return actionRow.createInputText(data);
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
        if (raw instanceof ComponentActionRow || raw instanceof ComponentSection || raw instanceof ComponentTextDisplay) {
          this.components.push(raw);
        } else {
          switch (raw.type) {
            case MessageComponentTypes.ACTION_ROW: {
              const component = new ComponentActionRow(raw);
              this.components.push(component);
            }; break;
            case MessageComponentTypes.SECTION: {
              const component = new ComponentSection(raw);
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
