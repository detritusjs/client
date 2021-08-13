import { Timers } from 'detritus-utils';

import { BaseCollection } from '../collections';
import { COMPONENT_CUSTOM_ID_SPLITTER, COMPONENT_LISTENER_TIMEOUT } from '../constants';
import { Interaction, InteractionDataComponent } from '../structures';
import { ComponentContext, ComponentListener } from '../utils';


export class ComponentHandler {
  listeners = new BaseCollection<string, {listener: ComponentListener, timeout: Timers.Timeout}>();

  delete(uniqueId: string): boolean {
    if (this.listeners.has(uniqueId)) {
      const { listener, timeout } = this.listeners.get(uniqueId)!;
      timeout.stop();
      return this.listeners.delete(uniqueId);
    }
    return false;
  }

  async execute(interaction: Interaction): Promise<void> {
    if (!this.listeners.length || !interaction.isFromMessageComponent || !interaction.message || !interaction.data) {
      return;
    }
    const data = interaction.data as InteractionDataComponent;
    const parts = data.customId.split(COMPONENT_CUSTOM_ID_SPLITTER);
    if (parts.length !== 2) {
      return;
    }
    const uniqueId = parts[0] || interaction.message.id;
    if (this.listeners.has(uniqueId)) {
      const { listener, timeout } = this.listeners.get(uniqueId)!;
      for (let actionRow of listener.components) {
        const component = actionRow.components.find((c) => c._customIdEncoded === data.customId);
        if (component) {
          if (typeof(component.run) === 'function') {
            const context = new ComponentContext(interaction, component);
            await Promise.resolve(component.run(context));
          }
          break;
        }
      }
    }
  }

  insert(listener: ComponentListener) {
    if (listener.id) {
      this.delete(listener.id);

      const timeout = new Timers.Timeout();
      const stored = {listener, timeout};

      // maybe make this adjustable
      timeout.start(COMPONENT_LISTENER_TIMEOUT, () => {
        if (this.listeners.get(listener.id) === stored) {
          this.delete(listener.id);
        }
      });
      this.listeners.set(listener.id, stored);
    }
  }
}
