

import { Timers } from 'detritus-utils';

import { BaseCollection } from '../collections';
import { INTERACTION_TIMEOUT } from '../constants';
import {
  Attachment,
  ComponentActionRow,
  ComponentCheckbox,
  ComponentCheckboxGroup,
  ComponentFileUpload,
  ComponentInputText,
  ComponentLabel,
  ComponentRadioGroup,
  ComponentSelectMenu,
  Interaction,
  InteractionDataModal,
} from '../structures';
import { InteractionModal, InteractionModalContext } from '../utils';


export class ModalSubmitHandler {
  // keyed by `userId.customId` when the opener is known, otherwise by `customId`
  listeners = new BaseCollection<string, InteractionModal>();
  timeouts = new BaseCollection<string, Timers.Timeout>();

  static getKey(customId: string, userId?: string): string {
    return (userId) ? `${userId}.${customId}` : customId;
  }

  delete(listenerId: string): boolean {
    if (this.timeouts.has(listenerId)) {
      this.timeouts.get(listenerId)!.stop();
      this.timeouts.delete(listenerId);
    }
    return this.listeners.delete(listenerId);
  }

  async execute(interaction: Interaction): Promise<void> {
    if (!this.listeners.length || !interaction.isFromModalSubmit || !interaction.data) {
      return;
    }
    const data = interaction.data as InteractionDataModal;

    let listenerId = ModalSubmitHandler.getKey(data.customId, interaction.userId);
    if (!this.listeners.has(listenerId)) {
      listenerId = data.customId;
    }
    const listener = this.listeners.get(listenerId);
    if (!listener) {
      return;
    }
    // a modal can only be submitted once per open, so stop listening (and don't fire onTimeout later)
    this.delete(listenerId);

    if (typeof(listener.run) === 'function') {
      const context = new InteractionModalContext(interaction);

      const args: Record<string, any> = {};
      for (let [i, topLevel] of context.components) {
        if (topLevel instanceof ComponentActionRow) {
          for (let [j, component] of topLevel.components) {
            if (component instanceof ComponentInputText) {
              args[component.customId] = component.value;
            }
          }
        } else if (topLevel instanceof ComponentLabel) {
          const component = topLevel.component;
          if (
            component instanceof ComponentCheckbox ||
            component instanceof ComponentInputText ||
            component instanceof ComponentRadioGroup
          ) {
            args[component.customId] = component.value;
          } else if (component instanceof ComponentCheckboxGroup || component instanceof ComponentSelectMenu) {
            args[component.customId] = component.values || [];
          } else if (component instanceof ComponentFileUpload) {
            // give the attachment objects instead of their ids
            const attachments: Array<Attachment> = [];
            for (let attachmentId of component.values) {
              if (data.resolved && data.resolved.attachments && data.resolved.attachments.has(attachmentId)) {
                attachments.push(data.resolved.attachments.get(attachmentId)!);
              }
            }
            args[component.customId] = attachments;
          }
        }
      }

      try {
        await Promise.resolve(listener.run(context, args));
      } catch(error: any) {
        try {
          if (typeof(listener.onError) === 'function') {
            await Promise.resolve(listener.onError(context, args, error));
          }
        } catch(e) {}
      }
    }
  }

  insert(listener: InteractionModal, userId?: string) {
    if (listener.id) {
      const listenerId = ModalSubmitHandler.getKey(listener.id, userId);
      this.delete(listenerId);
      {
        // always expire listeners, capped at 15 minutes (a timeout of 0 or less means the max)
        const amount = (0 < listener.timeout) ? Math.min(listener.timeout, INTERACTION_TIMEOUT) : INTERACTION_TIMEOUT;
        const timeout = new Timers.Timeout();
        this.timeouts.set(listenerId, timeout);
        timeout.start(amount, async () => {
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
}
