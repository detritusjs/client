

import { Timers } from 'detritus-utils';

import { BaseCollection } from '../collections';
import { ComponentInputText, Interaction, InteractionDataModal } from '../structures';
import { InteractionModal, InteractionModalContext } from '../utils';


export class ModalSubmitHandler {
  listeners = new BaseCollection<string, InteractionModal>();

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
    if (!this.listeners.length || !interaction.isFromModalSubmit || !interaction.data) {
      return;
    }
    const data = interaction.data as InteractionDataModal;

    const listener = this.listeners.get(data.customId);
    if (listener && typeof(listener.run) === 'function') {
      const context = new InteractionModalContext(interaction);

      const args: Record<string, any> = {};
      for (let [i, actionRow] of context.components) {
        for (let [customId, component] of actionRow.components) {
          if (component instanceof ComponentInputText) {
            args[customId] = component.value;
          }
        }
      }

      try {
        await Promise.resolve(listener.run(context, args));
      } catch(error) {
        try {
          if (typeof(listener.onError) === 'function') {
            await Promise.resolve(listener.onError(context, args, error));
          }
        } catch(e) {}
      }
    }
  }

  insert(listener: InteractionModal) {
    const listenerId = listener.id;
    if (listenerId) {
      this.delete(listenerId);
      if (listener.timeout) {
        const timeout = listener._timeout = new Timers.Timeout();
        timeout.start(listener.timeout, async () => {
          if (!listener.id) {
            return;
          }

          if (this.listeners.get(listener.id) === listener) {
            this.delete(listener.id);

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
}
