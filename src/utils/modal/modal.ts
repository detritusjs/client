import { RequestTypes } from 'detritus-client-rest';
import { Snowflake, Timers } from 'detritus-utils';

import {
  DetritusKeys,
  DiscordKeys,
  InteractionCallbackTypes,
  MessageComponentTypes,
  INTERACTION_TIMEOUT,
} from '../../constants';

import { BaseSet } from '../../collections/baseset';
import { BaseCollection } from '../../collections/basecollection';
import { Structure, setStructureKeys } from '../../structures/basestructure';

import {
  Components,
  ComponentActionData,
  ComponentActionRowData,
  ComponentActionRow,
  ComponentCheckbox,
  ComponentCheckboxGroup,
  ComponentFileUpload,
  ComponentInputText,
  ComponentLabel,
  ComponentLabelData,
  ComponentRadioGroup,
  ComponentSelectMenu,
  ComponentTextDisplay,
  ComponentTextDisplayData,
} from '../components';

import { InteractionModalContext } from './context';


export type InteractionModalArgs = Record<string, any>;

export type InteractionModalOnTimeout = () => unknown;
export type InteractionModalRun = (context: InteractionModalContext, args: InteractionModalArgs) => unknown;
export type InteractionModalOnError = (context: InteractionModalContext, args: InteractionModalArgs, error: Error) => unknown;


export interface InteractionModalOptions {
  components?: Array<
    ComponentActionRow | ComponentActionRowData |
    ComponentLabel | ComponentLabelData |
    ComponentTextDisplay | ComponentTextDisplayData
  >,
  customId?: string,
  custom_id?: string,
  timeout?: number,
  title?: string,

  onTimeout?: InteractionModalOnTimeout,
  run?: InteractionModalRun,
  onError?: InteractionModalOnError,
}


const keysInteractionModal = new BaseSet<string>([
  DiscordKeys.COMPONENTS,
  DiscordKeys.CUSTOM_ID,
  DiscordKeys.TITLE,
]);

export class InteractionModal extends Structure {
  static { setStructureKeys(this, '_keys', keysInteractionModal); }
  _timeout?: Timers.Timeout;

  components = new Components();
  customId: string = '';
  timeout: number = INTERACTION_TIMEOUT;
  title: string = '';

  onTimeout?(): unknown;
  run?(context: InteractionModalContext, args: InteractionModalArgs): unknown;
  onError?(context: InteractionModalContext, args: InteractionModalArgs, error: Error): unknown;

  constructor(data: InteractionModalOptions = {}) {
    super();
    Object.assign(data, {
      [DiscordKeys.CUSTOM_ID]: (data as any)[DetritusKeys[DiscordKeys.CUSTOM_ID]] || (data as any)[DiscordKeys.CUSTOM_ID],
    });
    if (((data as any)[DiscordKeys.CUSTOM_ID] === undefined) && !this.customId) {
      (data as any)[DiscordKeys.CUSTOM_ID] = Snowflake.generate().id;
    }
    this.merge(data);
    // not in `_keys` since it shouldn't be sent to discord
    if (data.timeout !== undefined) {
      this.timeout = data.timeout;
    }
    this.run = data.run || this.run;
    this.onError = data.onError || this.onError;
    this.onTimeout = data.onTimeout || this.onTimeout;
  }

  get id() {
    return this.customId;
  }

  addActionRow(data: ComponentActionRow | ComponentActionRowData = {}): this {
    this.components.addActionRow(data);
    return this;
  }

  addInputText(data: ComponentInputText | ComponentActionData = {}): this {
    this.components.addInputText(data);
    return this;
  }

  addLabel(data: ComponentLabel | ComponentLabelData = {}): this {
    this.components.addLabel(data);
    return this;
  }

  addTextDisplay(data: ComponentTextDisplay | ComponentTextDisplayData = {}): this {
    this.components.addTextDisplay(data);
    return this;
  }

  clear() {
    return this.components.clear();
  }

  createActionRow(data: ComponentActionRowData = {}): ComponentActionRow {
    return this.components.createActionRow(data);
  }

  createCheckbox(label: ComponentLabelData = {}, data: ComponentActionData = {}): ComponentCheckbox {
    return this.createLabel(label).createCheckbox(data);
  }

  createCheckboxGroup(label: ComponentLabelData = {}, data: ComponentActionData = {}): ComponentCheckboxGroup {
    return this.createLabel(label).createCheckboxGroup(data);
  }

  createFileUpload(label: ComponentLabelData = {}, data: ComponentActionData = {}): ComponentFileUpload {
    return this.createLabel(label).createFileUpload(data);
  }

  createInputText(data: ComponentActionData = {}): ComponentInputText {
    const actionRow = this.createActionRow();
    return actionRow.createInputText(data);
  }

  createLabel(data: ComponentLabelData = {}): ComponentLabel {
    return this.components.createLabel(data);
  }

  createRadioGroup(label: ComponentLabelData = {}, data: ComponentActionData = {}): ComponentRadioGroup {
    return this.createLabel(label).createRadioGroup(data);
  }

  createSelectMenu(label: ComponentLabelData = {}, data: ComponentActionData = {}): ComponentSelectMenu {
    return this.createLabel(label).createSelectMenu(data);
  }

  createTextDisplay(data: ComponentTextDisplayData = {}): ComponentTextDisplay {
    return this.components.createTextDisplay(data);
  }

  mergeValue(key: string, value: any): void {
    switch (key) {
      case DiscordKeys.COMPONENTS: {
        this.clear();
        if (value instanceof Components) {
          value = value.components;
        }
        for (let raw of value) {
          if (raw instanceof ComponentActionRow) {
            this.components.addActionRow(raw);
          } else if (raw instanceof ComponentLabel) {
            this.components.addLabel(raw);
          } else if (raw instanceof ComponentTextDisplay) {
            this.components.addTextDisplay(raw);
          } else {
            switch (raw.type) {
              case MessageComponentTypes.ACTION_ROW: {
                const component = new ComponentActionRow(raw);
                this.components.addActionRow(component);
              }; break;
              case MessageComponentTypes.LABEL: {
                const component = new ComponentLabel(raw);
                this.components.addLabel(component);
              }; break;
              case MessageComponentTypes.TEXT_DISPLAY: {
                const component = new ComponentTextDisplay(raw);
                this.components.addTextDisplay(component);
              }; break;
              default: {
                throw new Error(`Unknown component type ${raw.type}`);
              };
            }
          }
        }
      }; return;
    }
    return super.mergeValue(key, value);
  }

  toJSON(): RequestTypes.CreateInteractionResponseInnerPayload {
    return super.toJSON();
  }
}
