import { BaseSet } from '../../collections/baseset';
import {
  DetritusKeys,
  DiscordKeys,
  MessageComponentTypes,
} from '../../constants';
import { BaseStructureData } from '../../structures/basestructure';

import { ComponentActionBase, ComponentActionData } from './actionbase';
import { ComponentSelectMenuOption, ComponentSelectMenuOptionData } from './selectmenu';


const keysComponentCheckbox = new BaseSet<string>([
  DiscordKeys.CUSTOM_ID,
  DiscordKeys.DEFAULT,
  DiscordKeys.ID,
  DiscordKeys.TYPE,
]);

/**
 * Utils Component Checkbox Structure, only usable in modals inside of a label
 * @category Utils
 */
export class ComponentCheckbox extends ComponentActionBase {
  readonly _keys = keysComponentCheckbox;

  customId: string = '';
  default?: boolean;
  type = MessageComponentTypes.CHECKBOX;

  constructor(data: ComponentActionData = {}) {
    super(data);
    Object.assign(data, {
      [DiscordKeys.CUSTOM_ID]: (data as any)[DetritusKeys[DiscordKeys.CUSTOM_ID]] || (data as any)[DiscordKeys.CUSTOM_ID],
    });
    this.merge(data);
    this.type = MessageComponentTypes.CHECKBOX;
  }

  setCustomId(customId: string): this {
    this.merge({custom_id: customId});
    return this;
  }

  setDefault(isDefault: boolean): this {
    this.merge({default: isDefault});
    return this;
  }

  merge(data?: BaseStructureData): void {
    if (!data) {
      return;
    }

    if (DiscordKeys.CUSTOM_ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.CUSTOM_ID]] = data[DiscordKeys.CUSTOM_ID];
    }
    if (DiscordKeys.DEFAULT in data) {
      (this as any)[DetritusKeys[DiscordKeys.DEFAULT]] = data[DiscordKeys.DEFAULT];
    }
    if (DiscordKeys.ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.ID]] = data[DiscordKeys.ID];
    }
    if (DiscordKeys.TYPE in data) {
      (this as any)[DetritusKeys[DiscordKeys.TYPE]] = data[DiscordKeys.TYPE];
    }
  }
}


const keysComponentCheckboxGroup = new BaseSet<string>([
  DiscordKeys.CUSTOM_ID,
  DiscordKeys.ID,
  DiscordKeys.MAX_VALUES,
  DiscordKeys.MIN_VALUES,
  DiscordKeys.OPTIONS,
  DiscordKeys.REQUIRED,
  DiscordKeys.TYPE,
]);

/**
 * Utils Component Checkbox Group Structure, only usable in modals inside of a label
 * @category Utils
 */
export class ComponentCheckboxGroup extends ComponentActionBase {
  readonly _keys = keysComponentCheckboxGroup;

  customId: string = '';
  maxValues?: null | number;
  minValues?: null | number;
  options: Array<ComponentSelectMenuOption> = [];
  required?: boolean;
  type = MessageComponentTypes.CHECKBOX_GROUP;

  constructor(data: ComponentActionData = {}) {
    super(data);
    Object.assign(data, {
      [DiscordKeys.CUSTOM_ID]: (data as any)[DetritusKeys[DiscordKeys.CUSTOM_ID]] || (data as any)[DiscordKeys.CUSTOM_ID],
      [DiscordKeys.MAX_VALUES]: (data as any)[DetritusKeys[DiscordKeys.MAX_VALUES]] || (data as any)[DiscordKeys.MAX_VALUES],
      [DiscordKeys.MIN_VALUES]: (data as any)[DetritusKeys[DiscordKeys.MIN_VALUES]] || (data as any)[DiscordKeys.MIN_VALUES],
    });
    this.merge(data);
    this.type = MessageComponentTypes.CHECKBOX_GROUP;
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
    if (DiscordKeys.MAX_VALUES in data) {
      (this as any)[DetritusKeys[DiscordKeys.MAX_VALUES]] = data[DiscordKeys.MAX_VALUES];
    }
    if (DiscordKeys.MIN_VALUES in data) {
      (this as any)[DetritusKeys[DiscordKeys.MIN_VALUES]] = data[DiscordKeys.MIN_VALUES];
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
