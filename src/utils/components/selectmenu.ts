import { RequestTypes } from 'detritus-client-rest';

import { BaseSet } from '../../collections/baseset';
import {
  DetritusKeys,
  DiscordKeys,
  DiscordRegexNames,
  ChannelTypes,
  MessageComponentDefaultValueTypes,
  MessageComponentTypes,
} from '../../constants';
import { Structure } from '../../structures/basestructure';
import { Emoji } from '../../structures/emoji';
import { regex as discordRegex } from '../../utils';

import {
  ComponentActionBase,
  ComponentActionData,
  ComponentEmojiData,
  ComponentSelectMenuDefaultValueData,
} from './actionbase';


export interface ComponentSelectMenuOptionData {
  default?: boolean,
  description?: string,
  emoji?: ComponentEmojiData,
  id?: number,
  label?: string,
  value?: string,
}

const keysComponentSelectMenu = new BaseSet<string>([
  DiscordKeys.CHANNEL_TYPES,
  DiscordKeys.CUSTOM_ID,
  DiscordKeys.DEFAULT_VALUES,
  DiscordKeys.DISABLED,
  DiscordKeys.ID,
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

  channelTypes?: null | Array<ChannelTypes>;
  customId: string = '';
  defaultValues?: Array<ComponentSelectMenuDefaultValue> = [];
  disabled?: boolean;
  maxValues?: null | number;
  minValues?: null | number;
  options: Array<ComponentSelectMenuOption> = [];
  placeholder?: null | string;
  type = MessageComponentTypes.SELECT_MENU;

  constructor(data: ComponentActionData = {}) {
    super(data);
    Object.assign(data, {
      [DiscordKeys.CHANNEL_TYPES]: (
        (data as any)[DetritusKeys[DiscordKeys.CHANNEL_TYPES]] ||
        (data as any)[DiscordKeys.CHANNEL_TYPES]
      ),
      [DiscordKeys.CUSTOM_ID]: (data as any)[DetritusKeys[DiscordKeys.CUSTOM_ID]] || (data as any)[DiscordKeys.CUSTOM_ID],
      [DiscordKeys.DEFAULT_VALUES]: (
        (data as any)[DetritusKeys[DiscordKeys.DEFAULT_VALUES]] ||
        (data as any)[DiscordKeys.DEFAULT_VALUES]
      ),
      [DiscordKeys.MAX_VALUES]: (data as any)[DetritusKeys[DiscordKeys.MAX_VALUES]] || (data as any)[DiscordKeys.MAX_VALUES],
      [DiscordKeys.MIN_VALUES]: (data as any)[DetritusKeys[DiscordKeys.MIN_VALUES]] || (data as any)[DiscordKeys.MIN_VALUES],
    });
    this.merge(data);
    this.type = MessageComponentTypes.SELECT_MENU;
  }

  addChannelType(channelType: ChannelTypes): this {
    if (this.channelTypes) {
      this.channelTypes.push(channelType);
    } else {
      this.channelTypes = [channelType];
    }
    return this;
  }

  addDefaultValue(defaultValue: ComponentSelectMenuDefaultValue): this {
    if (this.defaultValues) {
      this.defaultValues.push(defaultValue);
    } else {
      this.defaultValues = [defaultValue];
    }
    return this;
  }

  addOption(option: ComponentSelectMenuOption): this {
    this.options.push(option);
    return this;
  }

  createDefaultValue(data: ComponentSelectMenuDefaultValueData): ComponentSelectMenuDefaultValue {
    const defaultValue = new ComponentSelectMenuDefaultValue(data);
    this.addDefaultValue(defaultValue);
    return defaultValue;
  }

  createOption(data: ComponentSelectMenuOptionData = {}): ComponentSelectMenuOption {
    const option = new ComponentSelectMenuOption(data);
    this.addOption(option);
    return option;
  }

  setChannelTypes(channelTypes: Array<ChannelTypes> = []): this {
    this.merge({channel_types: channelTypes});
    return this;
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
    if (value === undefined) {
      return;
    }
    switch (key) {
      case DiscordKeys.DEFAULT_VALUES: {
        if (!this.defaultValues) {
          this.defaultValues = [];
        }
        this.defaultValues.length = 0;
        for (let raw of value) {
          const defaultValue = new ComponentSelectMenuDefaultValue(raw);
          this.defaultValues.push(defaultValue);
        }
      }; return;
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


const keysComponentSelectMenuDefaultValue = new BaseSet<string>([
  DiscordKeys.ID,
  DiscordKeys.TYPE,
]);

/**
 * Utils Component Select Menu Option Structure
 * @category Utils
 */
 export class ComponentSelectMenuDefaultValue extends Structure {
  readonly _keys = keysComponentSelectMenuDefaultValue;

  id: string = '';
  type!: MessageComponentDefaultValueTypes;

  constructor(data: ComponentSelectMenuDefaultValueData) {
    super();
    this.merge(data);
  }

  setId(id: string): this {
    this.merge({id});
    return this;
  }

  setType(type: MessageComponentDefaultValueTypes): this {
    this.merge({type});
    return this;
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
    if (value === undefined) {
      return;
    }
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
