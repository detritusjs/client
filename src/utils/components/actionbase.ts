import { RequestTypes } from 'detritus-client-rest';
import { Snowflake } from 'detritus-utils';

import { BaseSet } from '../../collections/baseset';
import { DetritusKeys, DiscordKeys, MessageComponentTypes } from '../../constants';
import { Structure } from '../../structures/basestructure';
import { Emoji } from '../../structures/emoji';

import { ComponentOnError, ComponentRun } from './components';
import { ComponentContext } from './context';
import { ComponentSelectMenuOptionData } from './selectmenu';


export type ComponentEmojiData = {animated?: boolean, id?: null | string, name: string} | string | Emoji;

export interface ComponentActionData {
  custom_id?: string,
  customId?: string,
  disabled?: boolean,
  emoji?: ComponentEmojiData,
  label?: string,
  max_values?: number,
  maxValues?: number,
  min_values?: number,
  minValues?: number,
  options?: Array<ComponentSelectMenuOptionData>,
  placeholder?: string,
  style?: number,
  type?: number,
  url?: string,

  run?: ComponentRun,
  onError?: ComponentOnError,
}

const keysComponentActionBase = new BaseSet<string>([
  DiscordKeys.CUSTOM_ID,
  DiscordKeys.TYPE,
]);

export class ComponentActionBase extends Structure {
  readonly _keys = keysComponentActionBase;

  customId?: null | string;
  type: MessageComponentTypes = MessageComponentTypes.BUTTON;

  run?(context: ComponentContext): Promise<any> | any;
  onError?(context: ComponentContext, error: Error): Promise<any> | any;

  constructor(data: ComponentActionData = {}) {
    super();
    if (DetritusKeys[DiscordKeys.CUSTOM_ID] in data) {
      (data as any)[DiscordKeys.CUSTOM_ID] = (data as any)[DetritusKeys[DiscordKeys.CUSTOM_ID]];
    }
    this.run = data.run || this.run;
    this.onError = data.onError || this.onError;
    if (((data as any)[DiscordKeys.CUSTOM_ID] === undefined) && !this.customId) {
      (data as any)[DiscordKeys.CUSTOM_ID] = Snowflake.generate().id;
    }
    this.merge(data);
  }

  toJSON(): RequestTypes.RawChannelMessageComponent {
    const data = super.toJSON() as any;
    if (data[DiscordKeys.EMOJI] instanceof Emoji) {
      data[DiscordKeys.EMOJI] = {animated: data.emoji.animated, id: data.emoji.id, name: data.emoji.name};
    }
    if (data[DiscordKeys.URL] && data[DiscordKeys.CUSTOM_ID] !== undefined) {
      data[DiscordKeys.CUSTOM_ID] = null;
    }
    return data;
  }
}
