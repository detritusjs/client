import { BaseSet } from '../../collections/baseset';
import {
  DetritusKeys,
  DiscordKeys,
  MessageComponentTypes,
} from '../../constants';
import { BaseStructureData, setStructureKeys } from '../../structures/basestructure';

import { ComponentActionBase, ComponentActionData } from './actionbase';
import { ComponentSelectMenuOption, ComponentSelectMenuOptionData } from './selectmenu';


const keysComponentRadioGroup = new BaseSet<string>([
  DiscordKeys.CUSTOM_ID,
  DiscordKeys.ID,
  DiscordKeys.OPTIONS,
  DiscordKeys.REQUIRED,
  DiscordKeys.TYPE,
]);

/**
 * Utils Component Radio Group Structure, only usable in modals inside of a label
 * @category Utils
 */
export class ComponentRadioGroup extends ComponentActionBase {
  static { setStructureKeys(this, '_keys', keysComponentRadioGroup); }

  customId: string = '';
  options: Array<ComponentSelectMenuOption> = [];
  required?: boolean;
  type = MessageComponentTypes.RADIO_GROUP;

  constructor(data: ComponentActionData = {}) {
    super(data);
    Object.assign(data, {
      [DiscordKeys.CUSTOM_ID]: (data as any)[DetritusKeys[DiscordKeys.CUSTOM_ID]] || (data as any)[DiscordKeys.CUSTOM_ID],
    });
    this.merge(data);
    this.type = MessageComponentTypes.RADIO_GROUP;
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

  setRequired(required: boolean): this {
    this.merge({required});
    return this;
  }

  merge(data?: BaseStructureData): void {
    if (!data) {
      return;
    }

    if (DiscordKeys.CUSTOM_ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.CUSTOM_ID]] = data[DiscordKeys.CUSTOM_ID];
    }
    if (DiscordKeys.ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.ID]] = data[DiscordKeys.ID];
    }
    if (DiscordKeys.OPTIONS in data) {
      const value = data[DiscordKeys.OPTIONS];

      this.options = [];
      for (let raw of value) {
        if (raw instanceof ComponentSelectMenuOption) {
          this.addOption(raw);
        } else {
          this.createOption(raw);
        }
      }
    }
    if (DiscordKeys.REQUIRED in data) {
      (this as any)[DetritusKeys[DiscordKeys.REQUIRED]] = data[DiscordKeys.REQUIRED];
    }
    if (DiscordKeys.TYPE in data) {
      (this as any)[DetritusKeys[DiscordKeys.TYPE]] = data[DiscordKeys.TYPE];
    }
  }
}
