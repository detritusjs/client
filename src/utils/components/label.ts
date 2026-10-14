import { RequestTypes } from 'detritus-client-rest';

import { BaseSet } from '../../collections/baseset';
import { DetritusKeys, DiscordKeys, MessageComponentTypes } from '../../constants';
import { BaseStructureData, Structure, setStructureKeys } from '../../structures/basestructure';

import { ComponentActionData } from './actionbase';
import { ComponentCheckbox, ComponentCheckboxGroup } from './checkbox';
import { ComponentFileUpload } from './fileupload';
import { ComponentInputText } from './inputtext';
import { ComponentRadioGroup } from './radiogroup';
import { ComponentSelectMenu } from './selectmenu';


export type ComponentLabelChild = (
  ComponentCheckbox | ComponentCheckboxGroup | ComponentFileUpload |
  ComponentInputText | ComponentRadioGroup | ComponentSelectMenu
);

export interface ComponentLabelData {
  component?: ComponentLabelChild | ComponentActionData,
  description?: string,
  id?: number,
  label?: string,
  type?: number,
}


const keysComponentLabel = new BaseSet<string>([
  DiscordKeys.COMPONENT,
  DiscordKeys.DESCRIPTION,
  DiscordKeys.ID,
  DiscordKeys.LABEL,
  DiscordKeys.TYPE,
]);

/**
 * Utils Component Label Structure, used to wrap a single component inside of a modal
 * @category Utils
 */
export class ComponentLabel extends Structure {
  static { setStructureKeys(this, '_keys', keysComponentLabel); }

  component?: ComponentLabelChild;
  description?: null | string;
  id?: number;
  label: string = '';
  type = MessageComponentTypes.LABEL;

  constructor(data: ComponentLabelData = {}) {
    super();
    this.merge(data);
    this.type = MessageComponentTypes.LABEL;
  }

  createCheckbox(data: ComponentActionData = {}): ComponentCheckbox {
    const component = new ComponentCheckbox(data);
    this.setComponent(component);
    return component;
  }

  createCheckboxGroup(data: ComponentActionData = {}): ComponentCheckboxGroup {
    const component = new ComponentCheckboxGroup(data);
    this.setComponent(component);
    return component;
  }

  createFileUpload(data: ComponentActionData = {}): ComponentFileUpload {
    const component = new ComponentFileUpload(data);
    this.setComponent(component);
    return component;
  }

  createInputText(data: ComponentActionData = {}): ComponentInputText {
    const component = new ComponentInputText(data);
    this.setComponent(component);
    return component;
  }

  createRadioGroup(data: ComponentActionData = {}): ComponentRadioGroup {
    const component = new ComponentRadioGroup(data);
    this.setComponent(component);
    return component;
  }

  createSelectMenu(data: ComponentActionData = {}): ComponentSelectMenu {
    const component = new ComponentSelectMenu(data);
    this.setComponent(component);
    return component;
  }

  setComponent(data: ComponentLabelChild | ComponentActionData): this {
    if (
      data instanceof ComponentCheckbox || data instanceof ComponentCheckboxGroup ||
      data instanceof ComponentFileUpload || data instanceof ComponentInputText ||
      data instanceof ComponentRadioGroup || data instanceof ComponentSelectMenu
    ) {
      this.component = data;
    } else {
      switch (data.type) {
        case MessageComponentTypes.CHECKBOX: {
          this.component = new ComponentCheckbox(data);
        }; break;
        case MessageComponentTypes.CHECKBOX_GROUP: {
          this.component = new ComponentCheckboxGroup(data);
        }; break;
        case MessageComponentTypes.FILE_UPLOAD: {
          this.component = new ComponentFileUpload(data);
        }; break;
        case MessageComponentTypes.INPUT_TEXT: {
          this.component = new ComponentInputText(data);
        }; break;
        case MessageComponentTypes.RADIO_GROUP: {
          this.component = new ComponentRadioGroup(data);
        }; break;
        case MessageComponentTypes.SELECT_MENU:
        case MessageComponentTypes.USER_SELECT:
        case MessageComponentTypes.ROLE_SELECT:
        case MessageComponentTypes.MENTIONABLE_SELECT:
        case MessageComponentTypes.CHANNEL_SELECT: {
          this.component = new ComponentSelectMenu(data);
        }; break;
        default: {
          throw new Error(`Invalid component type ${data.type} for a label`);
        };
      }
    }
    return this;
  }

  setDescription(description: null | string): this {
    this.merge({description});
    return this;
  }

  setId(id: number): this {
    this.merge({id});
    return this;
  }

  setLabel(label: string): this {
    this.merge({label});
    return this;
  }

  merge(data?: BaseStructureData): void {
    if (!data) {
      return;
    }

    if (DiscordKeys.COMPONENT in data) {
      this.setComponent(data[DiscordKeys.COMPONENT]);
    }
    if (DiscordKeys.DESCRIPTION in data) {
      (this as any)[DetritusKeys[DiscordKeys.DESCRIPTION]] = data[DiscordKeys.DESCRIPTION];
    }
    if (DiscordKeys.ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.ID]] = data[DiscordKeys.ID];
    }
    if (DiscordKeys.LABEL in data) {
      (this as any)[DetritusKeys[DiscordKeys.LABEL]] = data[DiscordKeys.LABEL];
    }
    if (DiscordKeys.TYPE in data) {
      (this as any)[DetritusKeys[DiscordKeys.TYPE]] = data[DiscordKeys.TYPE];
    }
  }

  toJSON(): RequestTypes.RawChannelMessageComponent {
    return super.toJSON() as RequestTypes.RawChannelMessageComponent;
  }
}
