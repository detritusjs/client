import { RequestTypes } from 'detritus-client-rest';
import { Snowflake, Timers } from 'detritus-utils';

import {
  DetritusKeys,
  DiscordKeys,
  InteractionCallbackTypes,
  MessageComponentTypes,
} from '../../constants';

import { BaseSet } from '../../collections/baseset';
import { BaseCollection } from '../../collections/basecollection';
import { Structure } from '../../structures/basestructure';

import {
  Components,
  ComponentActionData,
  ComponentActionRowData,
  ComponentActionRow,
  ComponentInputText,
} from '../components';

import { InteractionModalContext } from './context';


export type InteractionModalArgs = Record<string, any>;

export type InteractionModalOnTimeout = () => Promise<any> | any;
export type InteractionModalRun = (context: InteractionModalContext, args: InteractionModalArgs) => Promise<any> | any;
export type InteractionModalOnError = (context: InteractionModalContext, args: InteractionModalArgs, error: Error) => Promise<any> | any;


export interface InteractionModalOptions {
  components?: Array<ComponentActionRowData | ComponentActionRow>,
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
  readonly _keys = keysInteractionModal;
  _timeout?: Timers.Timeout;

  components = new Components();
  customId: string = '';
  timeout: number = 10 * (60 * 1000); // 10 minutes
  title: string = '';

  onTimeout?(): Promise<any> | any;
  run?(context: InteractionModalContext, args: InteractionModalArgs): Promise<any> | any;
  onError?(context: InteractionModalContext, args: InteractionModalArgs, error: Error): Promise<any> | any;

  constructor(data: InteractionModalOptions = {}) {
    super();
    Object.assign(data, {
      [DiscordKeys.CUSTOM_ID]: (data as any)[DetritusKeys[DiscordKeys.CUSTOM_ID]] || (data as any)[DiscordKeys.CUSTOM_ID],
    });
    if (((data as any)[DiscordKeys.CUSTOM_ID] === undefined) && !this.customId) {
      (data as any)[DiscordKeys.CUSTOM_ID] = Snowflake.generate().id;
    }
    this.merge(data);
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

  clear() {
    return this.components.clear();
  }

  createActionRow(data: ComponentActionRowData = {}): ComponentActionRow {
    return this.components.createActionRow(data);
  }

  createInputText(data: ComponentActionData = {}): ComponentInputText {
    const actionRow = this.createActionRow();
    return actionRow.createInputText(data);
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
          } else {
            switch (raw.type) {
              case MessageComponentTypes.ACTION_ROW: {
                const component = new ComponentActionRow(raw);
                this.components.addActionRow(component);
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
