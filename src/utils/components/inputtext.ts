import { BaseSet } from '../../collections/baseset';
import {
  DetritusKeys,
  DiscordKeys,
  MessageComponentInputTextStyles,
  MessageComponentTypes,
} from '../../constants';

import { ComponentActionBase, ComponentActionData } from './actionbase';


const keysComponentInputText = new BaseSet<string>([
  DiscordKeys.CUSTOM_ID,
  DiscordKeys.LABEL,
  DiscordKeys.MAX_LENGTH,
  DiscordKeys.MIN_LENGTH,
  DiscordKeys.PLACEHOLDER,
  DiscordKeys.REQUIRED,
  DiscordKeys.STYLE,
  DiscordKeys.TYPE,
  DiscordKeys.VALUE,
]);

/**
 * Utils Component Input Text Structure
 * @category Utils
 */
 export class ComponentInputText extends ComponentActionBase {
  readonly _keys = keysComponentInputText;

  customId: string = '';
  label?: null | string;
  maxLength?: null | number;
  minLength?: null | number;
  placeholder?: null | string;
  required?: boolean;
  style: number = MessageComponentInputTextStyles.SHORT;
  type = MessageComponentTypes.INPUT_TEXT;
  value?: string;

  constructor(data: ComponentActionData = {}) {
    super(data);
    Object.assign(data, {
      [DiscordKeys.CUSTOM_ID]: (data as any)[DetritusKeys[DiscordKeys.CUSTOM_ID]] || (data as any)[DiscordKeys.CUSTOM_ID],
      [DiscordKeys.MAX_LENGTH]: (data as any)[DetritusKeys[DiscordKeys.MAX_LENGTH]] || (data as any)[DiscordKeys.MAX_LENGTH],
      [DiscordKeys.MIN_LENGTH]: (data as any)[DetritusKeys[DiscordKeys.MIN_LENGTH]] || (data as any)[DiscordKeys.MIN_LENGTH],
    });
    this.merge(data);
    this.type = MessageComponentTypes.INPUT_TEXT;
  }
}
