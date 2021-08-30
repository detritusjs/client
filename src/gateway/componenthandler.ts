import { Timers } from 'detritus-utils';

import { BaseCollection } from '../collections';
import { Interaction, InteractionDataComponent } from '../structures';
import { Components, ComponentContext } from '../utils';


export class ComponentHandler {
  listeners = new BaseCollection<string, Components>();

  delete(listenerId: string): boolean {
    if (this.listeners.has(listenerId)) {
      const listener = this.listeners.get(listenerId)!;
      if (listener._timeout) {
        listener._timeout.stop();
        listener._timeout = undefined;
      }
      return this.listeners.delete(listenerId);
    }
    return false;
  }

  async execute(interaction: Interaction): Promise<void> {
    if (!this.listeners.length || !interaction.isFromMessageComponent || !interaction.message || !interaction.data) {
      return;
    }
    const message = interaction.message;
    const data = interaction.data as InteractionDataComponent;

    const listener = this.listeners.get(message.interaction?.id || message.id) || this.listeners.get(message.id);
    if (listener) {
      try {
        if (typeof(listener.run) === 'function') {
          const context = new ComponentContext(interaction);
          await Promise.resolve(listener.run(context));
        }
      } catch(error) {

      }

      for (let actionRow of listener.components) {
        const component = actionRow.components.find((c) => c.customId === data.customId);
        if (component) {
          try {
            if (typeof(component.run) === 'function') {
              const context = new ComponentContext(interaction);
              await Promise.resolve(component.run(context));
            }
          } catch(error) {

          }
          break;
        }
      }
    }
  }

  insert(listener: Components) {
    const listenerId = listener.id;
    if (listenerId) {
      this.delete(listenerId);
      if (listener.timeout) {
        const timeout = listener._timeout = new Timers.Timeout();
        timeout.start(listener.timeout, async () => {
          if (this.listeners.get(listenerId) === listener) {
            this.delete(listenerId);

            try {
              if (typeof(listener.onTimeout) === 'function') {
                await Promise.resolve(listener.onTimeout());
              }
            } catch(error) {
      
            }
          }
        });
      }

      this.listeners.set(listenerId, listener);
    }
  }

  // replace interactionId's listener with a messageId listener
  replaceId(oldListenerId: string, newListenerId: string): void {
    if (oldListenerId === newListenerId) {
      return;
    }

    if (this.listeners.has(oldListenerId)) {
      const listener = this.listeners.get(oldListenerId)!;
      this.listeners.delete(oldListenerId);
      if (this.listeners.has(newListenerId)) {
        if (this.listeners.get(newListenerId) !== listener) {
          if (listener._timeout) {
            listener._timeout.stop();
            listener._timeout = undefined;
          }
        }
      } else {
        this.listeners.set(newListenerId, listener);
      }
    }
  }
}
