import { RequestTypes } from 'detritus-client-rest';
import { Timers } from 'detritus-utils';

import { BaseSet } from '../../collections/baseset';
import { DiscordKeys, MessageComponentTypes } from '../../constants';
import { Structure } from '../../structures/basestructure';

import { ComponentActionData } from './actionbase';
import { ComponentActionRowData, ComponentActionRow } from './actionrow';
import { ComponentButton } from './button';
import { ComponentContext } from './context';
import { ComponentSelectMenu } from './selectmenu';


export type ComponentOnTimeout = () => Promise<any> | any;
export type ComponentRun = (context: ComponentContext) => Promise<any> | any;


export interface ComponentsOptions {
  components?: Array<ComponentActionRowData | ComponentActionRow>,
  id?: string,
  timeout?: number,

  onTimeout?: ComponentOnTimeout,
  run?: ComponentRun,
}

const keysComponents = new BaseSet<string>([
  DiscordKeys.COMPONENTS,
  DiscordKeys.ID,
  DiscordKeys.TIMEOUT,
]);

/**
 * Utils Components Structure
 * @category Utils
 */
export class Components extends Structure {
  readonly _keys = keysComponents;
  _timeout?: Timers.Timeout;

  components: Array<ComponentActionRow> = [];
  id?: string;
  timeout: number = 10 * (60 * 1000); // 10 minutes

  onTimeout?(): Promise<any> | any;
  run?(context: ComponentContext): Promise<any> | any;

  constructor(data: ComponentsOptions = {}) {
    super();
    this.merge(data);
    this.run = data.run || this.run;
    this.onTimeout = data.onTimeout || this.onTimeout;
  }

  addActionRow(data: ComponentActionRow | ComponentActionRowData = {}): this {
    if (data instanceof ComponentActionRow) {
      this.components.push(data);
    } else {
      this.createActionRow(data);
    }
    return this;
  }

  addButton(data: ComponentButton | ComponentActionData = {}, inline = true): this {
    let actionRow: ComponentActionRow;
    if (inline) {
      actionRow = this.components.find((row) => row.isEmpty || !row.isFull) || this.createActionRow();
    } else {
      actionRow = this.createActionRow();
    }
    actionRow.addButton(data);
    return this;
  }

  addSelectMenu(data: ComponentSelectMenu | ComponentActionData = {}): this {
    const actionRow = this.createActionRow();
    actionRow.addSelectMenu(data);
    return this;
  }

  createActionRow(data: ComponentActionRowData = {}): ComponentActionRow {
    const actionRow = new ComponentActionRow(data);
    this.components.push(actionRow);
    return actionRow;
  }

  createButton(data: ComponentActionData = {}, inline = true): ComponentButton {
    let actionRow: ComponentActionRow;
    if (inline) {
      actionRow = this.components.find((row) => row.isEmpty || !row.isFull) || this.createActionRow();
    } else {
      actionRow = this.createActionRow();
    }
    return actionRow.createButton(data);
  }

  createSelectMenu(data: ComponentActionData = {}): ComponentSelectMenu {
    const actionRow = this.createActionRow();
    return actionRow.createSelectMenu(data);
  }

  mergeValue(key: string, value: any): void {
    switch (key) {
      case DiscordKeys.COMPONENTS: {
        this.components.length = 0;
        for (let raw of value) {
          if (raw instanceof ComponentActionRow) {
            this.components.push(raw);
          } else {
            switch (raw.type) {
              case MessageComponentTypes.ACTION_ROW: {
                const component = new ComponentActionRow(raw);
                this.components.push(component);
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

  toJSON(): Array<RequestTypes.RawChannelMessageComponent> {
    return this.components.map((component) => component.toJSON());
  }
}
