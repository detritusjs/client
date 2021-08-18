import { RequestTypes } from 'detritus-client-rest';

import { BaseSet } from '../../collections/baseset';
import {
  DiscordKeys,
  MessageComponentTypes,
  MAX_ACTION_ROW_BUTTONS,
  MAX_ACTION_ROW_SELECT_MENUS,
} from '../../constants';
import { Structure } from '../../structures/basestructure';

import { ComponentActionData } from './actionbase';
import { ComponentButton } from './button';
import { ComponentSelectMenu } from './selectmenu';


export interface ComponentActionRowData {
  components?: Array<ComponentActionData>,
  type?: number,
}

const keysComponentActionRow = new BaseSet<string>([
  DiscordKeys.COMPONENTS,
  DiscordKeys.TYPE,
]);

/**
 * Utils Component Action Row Structure
 * @category Utils
 */
 export class ComponentActionRow extends Structure {
  readonly _keys = keysComponentActionRow;

  components: Array<ComponentButton | ComponentSelectMenu> = [];
  type = MessageComponentTypes.ACTION_ROW;

  constructor(data: ComponentActionRowData = {}) {
    super();
    this.merge(data);
    this.type = MessageComponentTypes.ACTION_ROW;
  }

  get hasButton(): boolean {
    for (let component of this.components) {
      if (component.type === MessageComponentTypes.BUTTON) {
        return true;
      }
    }
    return false;
  }

  get hasRun(): boolean {
    return this.components.some((component) => typeof(component.run) === 'function');
  }

  get hasSelectMenu(): boolean {
    for (let component of this.components) {
      if (component.type === MessageComponentTypes.SELECT_MENU) {
        return true;
      }
    }
    return false;
  }

  get isEmpty(): boolean {
    return !this.components.length;
  }

  get isFull(): boolean {
    if (this.hasSelectMenu) {
      return MAX_ACTION_ROW_SELECT_MENUS <= this.components.length;
    } else if (this.hasButton) {
      return MAX_ACTION_ROW_BUTTONS <= this.components.length;
    }
    return false;
  }

  addButton(data: ComponentButton | ComponentActionData = {}): this {
    if (data instanceof ComponentButton) {
      return this.addComponent(data);
    }
    return this.addComponent(new ComponentButton(data));
  }

  addComponent(component: ComponentButton | ComponentSelectMenu): this {
    this.components.push(component);
    return this;
  }

  addSelectMenu(data: ComponentSelectMenu | ComponentActionData = {}): this {
    if (data instanceof ComponentSelectMenu) {
      return this.addComponent(data);
    }
    return this.addComponent(new ComponentSelectMenu(data));
  }

  createButton(data: ComponentActionData = {}): ComponentButton {
    const component = new ComponentButton(data);
    this.addComponent(component);
    return component;
  }

  createSelectMenu(data: ComponentActionData = {}): ComponentSelectMenu {
    const component = new ComponentSelectMenu(data);
    this.addComponent(component);
    return component;
  }

  mergeValue(key: string, value: any): void {
    switch (key) {
      case DiscordKeys.COMPONENTS: {
        this.components.length = 0;
        for (let raw of value) {
          switch (raw.type) {
            case MessageComponentTypes.BUTTON: {
              const component = new ComponentButton(raw);
              this.components.push(component);
            }; break;
            case MessageComponentTypes.SELECT_MENU: {
              const component = new ComponentSelectMenu(raw);
              this.components.push(component);
            }; break;
            default: {
              throw new Error(`Unknown component type ${raw.type}`);
            };
          }
        }
      }; return;
    }
    return super.mergeValue(key, value);
  }

  toJSON(): RequestTypes.RawChannelMessageComponent {
    return super.toJSON() as RequestTypes.RawChannelMessageComponent;
  }
}
