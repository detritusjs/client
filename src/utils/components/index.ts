import { RequestTypes } from 'detritus-client-rest';

import { MessageComponentTypes } from '../../constants';

import { ComponentActionRow } from './actionrow';
import { Components } from './components';

export * from './actionbase';
export * from './actionrow';
export * from './button';
export * from './components';
export * from './context';
export * from './selectmenu';


export interface CreateComponentListenerOrNone {
  components?: Components | Array<RequestTypes.CreateChannelMessageComponent | RequestTypes.toJSON<RequestTypes.RawChannelMessageComponent>> | RequestTypes.toJSON<Array<RequestTypes.RawChannelMessageComponent>>,
}

// returns false when none of the components need to be hooked
export function createComponentListenerOrNone(
  options?: CreateComponentListenerOrNone | string,
  id?: string,
): Components | null | false {
  if (!options || typeof(options) !== 'object' || !options.components) {
    return null;
  }
  if (options.components instanceof Components) {
    if (!options.components.components.length) {
      return false;
    }
    options.components.id = id || options.components.id;
    return options.components;
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
        return new Components({components: actionRows, id});
      }
    }
  }
  return false;
}
