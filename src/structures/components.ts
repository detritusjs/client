import {
  ApplicationCommandOptionTypes,
  ApplicationCommandTypes,
  DetritusKeys,
  DiscordKeys,
  InteractionCallbackTypes,
} from '../constants';

import { ShardClient } from '../client';
import { BaseCollection } from '../collections/basecollection';
import { BaseSet } from '../collections/baseset';
import {
  MessageComponentButtonStyles,
  MessageComponentTypes,
} from '../constants';

import {
  BaseStructure,
  BaseStructureData,
} from './basestructure';
import { Emoji } from './emoji';



const keysComponentActionRow = new BaseSet<string>([
  DiscordKeys.COMPONENTS,
  DiscordKeys.TYPE,
]);

/**
 * Component Action Row Structure
 * @category Structure
 */
export class ComponentActionRow extends BaseStructure {
  readonly _uncloneable = true;
  readonly _keys = keysComponentActionRow;

  components = new BaseCollection<string, ComponentUnknown | ComponentButton | ComponentSelectMenu | ComponentInputText>();
  type: MessageComponentTypes = MessageComponentTypes.ACTION_ROW;

  constructor(
    client: ShardClient,
    data?: BaseStructureData,
    isClone?: boolean,
  ) {
    super(client, undefined, isClone);
    this.merge(data);
  }

  mergeValue(key: string, value: any): void {
    if (value !== undefined) {
      switch (key) {
        case DiscordKeys.COMPONENTS: {
          this.components.clear();
          for (let raw of value) {
            let component: ComponentUnknown | ComponentButton | ComponentSelectMenu | ComponentInputText;
            switch (raw.type) {
              case MessageComponentTypes.BUTTON: {
                component = new ComponentButton(this, raw);
              }; break;
              case MessageComponentTypes.INPUT_TEXT: {
                component = new ComponentInputText(this, raw);
              }; break;
              case MessageComponentTypes.SELECT_MENU: {
                component = new ComponentSelectMenu(this, raw);
              }; break;
              default: {
                component = new ComponentUnknown(this, raw);
              };
            }
            this.components.set(component.id, component);
          }
        }; return;
      }
      return super.mergeValue(key, value);
    }
  }
}


const keysComponentUnknown = new BaseSet<string>([
  DiscordKeys.TYPE,
]);

/**
 * Component Unknown Structure
 * @category Structure
 */
export class ComponentUnknown extends BaseStructure {
  readonly _uncloneable = true;
  readonly _keys = keysComponentUnknown;
  readonly actionRow: ComponentActionRow;

  id: string = 'unknown' + Date.now();
  type: MessageComponentTypes = MessageComponentTypes.BUTTON;

  constructor(actionRow: ComponentActionRow, data: BaseStructureData) {
    super(actionRow.client, undefined, actionRow._clone);
    this.actionRow = actionRow;
    this.merge(data);
    Object.defineProperty(this, 'actionRow', {enumerable: false});
  }
}


const keysComponentButton = new BaseSet<string>([
  DiscordKeys.CUSTOM_ID,
  DiscordKeys.DISABLED,
  DiscordKeys.EMOJI,
  DiscordKeys.LABEL,
  DiscordKeys.STYLE,
  DiscordKeys.TYPE,
  DiscordKeys.URL,
]);

/**
 * Component Button Structure
 * @category Structure
 */
export class ComponentButton extends BaseStructure {
  readonly _uncloneable = true;
  readonly _keys = keysComponentButton;
  readonly actionRow: ComponentActionRow;

  customId?: string;
  disabled?: boolean;
  emoji?: Emoji;
  label?: string;
  style?: MessageComponentButtonStyles;
  type: MessageComponentTypes = MessageComponentTypes.BUTTON;
  url?: string;

  constructor(actionRow: ComponentActionRow, data: BaseStructureData) {
    super(actionRow.client, undefined, actionRow._clone);
    this.actionRow = actionRow;
    this.merge(data);
    Object.defineProperty(this, 'actionRow', {enumerable: false});
  }

  get id(): string {
    return this.url || this.customId || '';
  }

  mergeValue(key: string, value: any): void {
    if (value !== undefined) {
      switch (key) {
        case DiscordKeys.EMOJI: {
          if (this.emoji) {
            this.emoji.merge(value);
          } else {
            this.emoji = new Emoji(this.client, value);
          }
        }; return;
      }
      return super.mergeValue(key, value);
    }
  }
}


const keysMessageComponentSelectMenu = new BaseSet<string>([
  DiscordKeys.CUSTOM_ID,
  DiscordKeys.MAX_VALUES,
  DiscordKeys.MIN_VALUES,
  DiscordKeys.OPTIONS,
  DiscordKeys.PLACEHOLDER,
  DiscordKeys.TYPE,
]);

/**
 * Component Select Menu Structure
 * @category Structure
 */
export class ComponentSelectMenu extends BaseStructure {
  readonly _uncloneable = true;
  readonly _keys = keysMessageComponentSelectMenu;
  readonly actionRow: ComponentActionRow;

  customId: string = '';
  maxValues: number = 1;
  minValues: number = 1;
  options = new BaseCollection<string, ComponentSelectMenuOption>();
  placeholder: string = '';
  type: MessageComponentTypes.SELECT_MENU = MessageComponentTypes.SELECT_MENU;

  constructor(actionRow: ComponentActionRow, data: BaseStructureData) {
    super(actionRow.client, undefined, actionRow._clone);
    this.actionRow = actionRow;
    this.merge(data);
    Object.defineProperty(this, 'actionRow', {enumerable: false});
  }

  get id(): string {
    return this.customId;
  }

  mergeValue(key: string, value: any): void {
    if (value !== undefined) {
      switch (key) {
        case DiscordKeys.OPTIONS: {
          this.options.clear();
          for (let raw of value) {
            const option = new ComponentSelectMenuOption(this, raw);
            this.options.set(option.label, option);
          }
        }; return;
      }
      return super.mergeValue(key, value);
    }
  }
}


const keysComponentSelectMenuOption = new BaseSet<string>([
  DiscordKeys.DEFAULT,
  DiscordKeys.DESCRIPTION,
  DiscordKeys.EMOJI,
  DiscordKeys.LABEL,
  DiscordKeys.VALUE,
]);

/**
 * Component Select Menu Option Structure
 * @category Structure
 */
export class ComponentSelectMenuOption extends BaseStructure {
  readonly _uncloneable = true;
  readonly _keys = keysComponentSelectMenuOption;
  readonly selectMenu: ComponentSelectMenu;

  default: boolean = false;
  description?: string;
  emoji?: Emoji;
  label: string = '';
  value: string = '';

  constructor(selectMenu: ComponentSelectMenu, data: BaseStructureData) {
    super(selectMenu.client, undefined, selectMenu._clone);
    this.selectMenu = selectMenu;
    this.merge(data);
    Object.defineProperty(this, 'selectMenu', {enumerable: false});
  }

  mergeValue(key: string, value: any): void {
    if (value !== undefined) {
      switch (key) {
        case DiscordKeys.EMOJI: {
          if (this.emoji) {
            this.emoji.merge(value);
          } else {
            this.emoji = new Emoji(this.client, value);
          }
        }; return;
      }
      return super.mergeValue(key, value);
    }
  }
}


const keysMessageComponentInputText = new BaseSet<string>([
  DiscordKeys.CUSTOM_ID,
  DiscordKeys.TYPE,
  DiscordKeys.VALUE,
]);

/**
 * Component Select Menu Structure
 * @category Structure
 */
export class ComponentInputText extends BaseStructure {
  readonly _uncloneable = true;
  readonly _keys = keysMessageComponentInputText;
  readonly actionRow: ComponentActionRow;

  customId: string = '';
  type: MessageComponentTypes.INPUT_TEXT = MessageComponentTypes.INPUT_TEXT;
  value?: string;

  constructor(actionRow: ComponentActionRow, data: BaseStructureData) {
    super(actionRow.client, undefined, actionRow._clone);
    this.actionRow = actionRow;
    this.merge(data);
    Object.defineProperty(this, 'actionRow', {enumerable: false});
  }

  get id(): string {
    return this.customId;
  }
}
