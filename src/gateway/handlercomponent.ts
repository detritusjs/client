import { Timers } from 'detritus-utils';

import { BaseCollection } from '../collections';
import { Interaction, InteractionDataComponent, Message } from '../structures';
import {
  Components,
  ComponentActionBase,
  ComponentActionRow,
  ComponentButton,
  ComponentContainer,
  ComponentContext,
  ComponentSection,
} from '../utils';


// the interaction id a message is the original response to (listeners for interaction responses are stored under it)
// `message.interaction` is deprecated, `interactionMetadata` only counts if the message isn't a followup
export function getResponseInteractionId(message: Message): string | undefined {
  if (message.interaction) {
    return message.interaction.id;
  }
  if (message.interactionMetadata && !message.interactionMetadata.originalResponseMessageId) {
    return message.interactionMetadata.id;
  }
  return undefined;
}


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

    let listener: Components | undefined;
    const interactionId = getResponseInteractionId(message);
    if (interactionId) {
      listener = this.listeners.get(interactionId);
    }
    if (!listener) {
      listener = this.listeners.get(message.id);
    }
    if (listener) {
      const context = new ComponentContext(interaction);
      try {
        if (typeof(listener.run) === 'function') {
          await Promise.resolve(listener.run(context));
        }
      } catch(error: any) {
        try {
          if (typeof(listener.onError) === 'function') {
            await Promise.resolve(listener.onError(context, error));
          }
        } catch(e) {}
        // the listener's run acts as a gate, don't run the component if it failed
        return;
      }

      for (let topLevel of listener.components) {
        let component: ComponentActionBase | undefined;
        if (topLevel instanceof ComponentActionRow) {
          component = topLevel.components.find((c) => c.customId === data.customId);
        } else if (topLevel instanceof ComponentContainer) {
          for (let c of topLevel.components) {
            if (c instanceof ComponentActionRow) {
              component = c.components.find((x) => x.customId === data.customId);
              if (component) {
                break;
              }
            } else if (c instanceof ComponentSection) {
              if (c.accessory instanceof ComponentButton && c.accessory.customId === data.customId) {
                component = c.accessory;
                break;
              }
            }
          }
        } else if (topLevel instanceof ComponentSection) {
          if (topLevel.accessory instanceof ComponentButton && topLevel.accessory.customId === data.customId) {
            component = topLevel.accessory;
          }
        }

        if (component) {
          try {
            if (typeof(component.run) === 'function') {
              await Promise.resolve(component.run(context));
            }
          } catch(error: any) {
            // fall back to the listener's onError only if the component doesn't handle it
            try {
              if (typeof(component.onError) === 'function') {
                await Promise.resolve(component.onError(context, error));
              } else if (typeof(listener.onError) === 'function') {
                await Promise.resolve(listener.onError(context, error));
              }
            } catch(e) {}
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

  // replace interactionId's listener with a messageId listener
  replaceId(oldListenerId: string, newListenerId: string): void {
    if (oldListenerId === newListenerId) {
      return;
    }

    if (this.listeners.has(oldListenerId)) {
      const listener = this.listeners.get(oldListenerId)!;

      this.listeners.delete(oldListenerId);
      if (this.listeners.has(newListenerId)) {
        // a newer listener already owns the message, drop the old one without pointing its id at the newer one's key
        if (this.listeners.get(newListenerId) !== listener) {
          if (listener._timeout) {
            listener._timeout.stop();
            listener._timeout = undefined;
          }
        }
      } else {
        listener.id = newListenerId;
        this.listeners.set(newListenerId, listener);
      }
    }
  }
}
