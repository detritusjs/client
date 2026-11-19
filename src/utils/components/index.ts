import { RequestTypes } from 'detritus-client-rest';

import { MessageComponentTypes } from '../../constants';

import { ComponentActionRow } from './actionrow';
import { Components } from './components';
import { ComponentContainer } from './container';
import { ComponentSection } from './section';

export * from './actionbase';
export * from './actionrow';
export * from './button';
export * from './checkbox';
export * from './components';
export * from './container';
export * from './context';
export * from './file';
export * from './fileupload';
export * from './inputtext';
export * from './label';
export * from './mediagallery';
export * from './radiogroup';
export * from './section';
export * from './selectmenu';
export * from './separator';
export * from './textdisplay';
export * from './thumbnail';


export interface CreateComponentListenerOrNone {
  components?: Components | Array<RequestTypes.CreateChannelMessageComponent | RequestTypes.toJSON<RequestTypes.RawChannelMessageComponent>> | RequestTypes.toJSON<Array<RequestTypes.RawChannelMessageComponent>>,
  listenerId?: string,
}

// returns false when none of the components need to be hooked
export function createComponentListenerOrNone(
  options?: CreateComponentListenerOrNone | string,
  id?: string,
): null | [string, Components | null, boolean] {
  if (!options || typeof(options) !== 'object' || !options.components) {
    return null;
  }
  id = options.listenerId || id;

  if (options.components instanceof Components) {
    // an id we registered it under before (the message it was first sent with) isn't one the caller picked
    const components = options.components;
    if (components.id && components.id !== components._registeredId) {
      id = components.id;
    }
    if (!options.components.components.length) {
      return [id || '', null, false];
    }

    options.components.id = id;
    return [id || '', options.components, options.components.isV2];
  } else {
    if (Array.isArray(options.components) && options.components.length) {
      const components = options.components.map((component: any) => {
        if (component instanceof ComponentActionRow || component instanceof ComponentContainer || component instanceof ComponentSection) {
          return component;
        }
        switch (component.type) {
          case MessageComponentTypes.ACTION_ROW: {
            return new ComponentActionRow(component);
          };
          case MessageComponentTypes.CONTAINER: {
            return new ComponentContainer(component);
          };
          case MessageComponentTypes.SECTION: {
            return new ComponentSection(component);
          };
        };
        return null;
      }).filter((x) => x) as Array<ComponentActionRow | ComponentContainer | ComponentSection>;
      if (components.length) {
        // todo: only handles action rows, containers and sections, not the other v2 components
        const componentsObject = new Components({components, id});
        if (components.some((row) => row.hasRun)) {
          return [id || '', componentsObject, componentsObject.isV2];
        }
        return ['', null, componentsObject.isV2];
      }
    }
  }
  return ['', null, false];
}
