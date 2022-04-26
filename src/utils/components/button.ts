import { BaseSet } from '../../collections/baseset';
import {
  DiscordKeys,
  DiscordRegexNames,
  MessageComponentButtonStyles,
  MessageComponentTypes,
} from '../../constants';
import { Emoji } from '../../structures/emoji';
import { regex as discordRegex } from '../../utils';

import { ComponentActionBase, ComponentActionData, ComponentEmojiData } from './actionbase';


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
 * Utils Component Button Structure
 * @category Utils
 */
 export class ComponentButton extends ComponentActionBase {
  readonly _keys = keysComponentButton;

  declare customId?: null | string;

  disabled?: boolean;
  emoji?: null | ComponentEmojiData;
  label?: null | string;
  style: MessageComponentButtonStyles = MessageComponentButtonStyles.PRIMARY;
  type = MessageComponentTypes.BUTTON;
  url?: null | string;

  constructor(data: ComponentActionData = {}) {
    super(data);
    if ((data as any)[DiscordKeys.URL] && ((data as any)[DiscordKeys.CUSTOM_ID] === undefined)) {
      (data as any)[DiscordKeys.CUSTOM_ID] = null;
    }
    this.merge(data);
    this.type = MessageComponentTypes.BUTTON;
  }

  setCustomId(customId: null | string): this {
    this.merge({[DiscordKeys.CUSTOM_ID]: customId});
    return this;
  }

  setDisabled(disabled: boolean): this {
    this.merge({disabled});
    return this;
  }

  setEmoji(emoji: null | ComponentEmojiData): this {
    this.merge({emoji});
    return this;
  }

  setLabel(label: null | string): this {
    this.merge({label});
    return this;
  }

  setStyle(style: MessageComponentButtonStyles): this {
    this.merge({style});
    return this;
  }

  setUrl(url: null | string): this {
    this.merge({url});
    if (url) {
      this.setStyle(MessageComponentButtonStyles.LINK);
    }
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
}
