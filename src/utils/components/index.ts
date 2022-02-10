import { RequestTypes } from 'detritus-client-rest';

import { MessageComponentTypes } from '../../constants';

import { ComponentActionRow } from './actionrow';
import { Components } from './components';

export * from './actionbase';
export * from './actionrow';
export * from './button';
export * from './components';
export * from './context';
export * from './inputtext';
export * from './selectmenu';


export interface CreateComponentListenerOrNone {
  components?: Components | Array<RequestTypes.CreateChannelMessageComponent | RequestTypes.toJSON<RequestTypes.RawChannelMessageComponent>> | RequestTypes.toJSON<Array<RequestTypes.RawChannelMessageComponent>>,
  listenerId?: string,
}

// returns false when none of the components need to be hooked
export function createComponentListenerOrNone(
  options?: CreateComponentListenerOrNone | string,
  id?: string,
): null | [string, Components | null] {
  if (!options || typeof(options) !== 'object' || !options.components) {
    return null;
  }
  id = options.listenerId || id;

  if (options.components instanceof Components) {
    id = options.components.id || id;
    if (!options.components.components.length) {
      return [id || '', null];
    }

    options.components.id = id;
    return [id || '', options.components];
  } else {
    if (Array.isArray(options.components) && options.components.length) {
      const actionRows = options.components.map((component: any) => {
        if (component instanceof ComponentActionRow) {
          return component;
        } else if (component.type === MessageComponentTypes.ACTION_ROW) {
          return new ComponentActionRow(component);
        }
        return null;
      }).filter((x) => x) as Array<ComponentActionRow>;
      if (actionRows.length && actionRows.some((row) => row.hasRun)) {
        return [id || '', new Components({components: actionRows, id})];
      }
    }
  }
  return ['', null];
}
