import { RequestTypes } from 'detritus-client-rest';

import { BaseSet } from '../../collections/baseset';
import {
  DetritusKeys,
  DiscordKeys,
  DiscordRegexNames,
  MessageComponentTypes,
} from '../../constants';
import { Structure } from '../../structures/basestructure';
import { Emoji } from '../../structures/emoji';
import { regex as discordRegex } from '../../utils';

import { ComponentActionBase, ComponentActionData, ComponentEmojiData } from './actionbase';


export interface ComponentSelectMenuOptionData {
  default?: boolean,
  description?: string,
  emoji?: ComponentEmojiData,
  label?: string,
  value?: string,
}

const keysComponentSelectMenu = new BaseSet<string>([
  DiscordKeys.CUSTOM_ID,
  DiscordKeys.MAX_VALUES,
  DiscordKeys.MIN_VALUES,
  DiscordKeys.OPTIONS,
  DiscordKeys.PLACEHOLDER,
  DiscordKeys.TYPE,
]);

/**
 * Utils Component Select Menu Structure
 * @category Utils
 */
 export class ComponentSelectMenu extends ComponentActionBase {
  readonly _keys = keysComponentSelectMenu;

  customId: string = '';
  maxValues?: null | number;
  minValues?: null | number;
  options: Array<ComponentSelectMenuOption> = [];
  placeholder?: null | string;
  type = MessageComponentTypes.SELECT_MENU;

  constructor(data: ComponentActionData = {}) {
    super();
    Object.assign(data, {
      [DiscordKeys.CUSTOM_ID]: (data as any)[DetritusKeys[DiscordKeys.CUSTOM_ID]] || (data as any)[DiscordKeys.CUSTOM_ID],
      [DiscordKeys.MAX_VALUES]: (data as any)[DetritusKeys[DiscordKeys.MAX_VALUES]] || (data as any)[DiscordKeys.MAX_VALUES],
      [DiscordKeys.MIN_VALUES]: (data as any)[DetritusKeys[DiscordKeys.MIN_VALUES]] || (data as any)[DiscordKeys.MIN_VALUES],
    });
    this.merge(data);
    this.type = MessageComponentTypes.SELECT_MENU;
  }

  addOption(option: ComponentSelectMenuOption): this {
    this.options.push(option);
    return this;
  }

  createOption(data: ComponentSelectMenuOptionData = {}): ComponentSelectMenuOption {
    const option = new ComponentSelectMenuOption(data);
    this.addOption(option);
    return option;
  }

  setCustomId(customId: string): this {
    this.merge({custom_id: customId});
    return this;
  }

  setMaxValues(maxValues: null | number): this {
    this.merge({max_values: maxValues});
    return this;
  }

  setMinValues(minValues: null | number): this {
    this.merge({min_values: minValues});
    return this;
  }

  setPlaceholder(placeholder: null | string): this {
    this.merge({placeholder});
    return this;
  }

  mergeValue(key: string, value: any): void {
    switch (key) {
      case DiscordKeys.OPTIONS: {
        this.options.length = 0;
        for (let raw of value) {
          const option = new ComponentSelectMenuOption(raw);
          this.options.push(option);
        }
      }; return;
    }
    return super.mergeValue(key, value);
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
 * Utils Component Select Menu Option Structure
 * @category Utils
 */
 export class ComponentSelectMenuOption extends Structure {
  readonly _keys = keysComponentSelectMenuOption;

  default?: boolean;
  description?: null | string;
  emoji?: null | ComponentEmojiData;
  label: string = '';
  value: string = '';

  constructor(data: ComponentSelectMenuOptionData = {}) {
    super();
    this.merge(data);
  }

  setDefault(isDefault: boolean): this {
    this.merge({default: isDefault});
    return this;
  }

  setDescription(description: null | string): this {
    this.merge({description});
    return this;
  }

  setEmoji(emoji: null | ComponentEmojiData): this {
    this.merge({emoji});
    return this;
  }

  setLabel(label: string): this {
    this.merge({label});
    return this;
  }

  setValue(value: string): this {
    this.merge({value});
    return this;
  }

  mergeValue(key: string, value: any): void {
    switch (key) {
      case DiscordKeys.EMOJI: {
        if (value instanceof Emoji) {
          value = {animated: value.animated, id: value.id, name: value.name};
        } else if (typeof(value) === 'string') {
          const { matches } = discordRegex(DiscordRegexNames.EMOJI, value);
          if (matches.length) {
            value = matches[0];
          } else {
            value = {name: value};
          }
        }
      }; break;
    }
    return super.mergeValue(key, value);
  }

  toJSON(): RequestTypes.RawChannelMessageComponentSelectMenuOption {
    const data = super.toJSON() as any;
    if (data.emoji instanceof Emoji) {
      data.emoji = {animated: data.emoji.animated, id: data.emoji.id, name: data.emoji.name};
    }
    return data;
  }
}
