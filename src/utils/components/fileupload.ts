import { BaseSet } from '../../collections/baseset';
import {
  DetritusKeys,
  DiscordKeys,
  MessageComponentTypes,
} from '../../constants';
import { BaseStructureData, setStructureKeys } from '../../structures/basestructure';

import { ComponentActionBase, ComponentActionData } from './actionbase';


const keysComponentFileUpload = new BaseSet<string>([
  DiscordKeys.CUSTOM_ID,
  DiscordKeys.FILE_TYPES,
  DiscordKeys.ID,
  DiscordKeys.MAX_VALUES,
  DiscordKeys.MIN_VALUES,
  DiscordKeys.REQUIRED,
  DiscordKeys.TYPE,
]);

/**
 * Utils Component File Upload Structure, only usable in modals inside of a label
 * @category Utils
 */
export class ComponentFileUpload extends ComponentActionBase {
  static { setStructureKeys(this, '_keys', keysComponentFileUpload); }

  customId: string = '';
  fileTypes?: null | Array<string>;
  maxValues?: null | number;
  minValues?: null | number;
  required?: boolean;
  type = MessageComponentTypes.FILE_UPLOAD;

  constructor(data: ComponentActionData = {}) {
    // work on a copy, the generated custom id (and key renames) shouldn't end up in the caller's object
    data = Object.assign({}, data);
    super(data);
    Object.assign(data, {
      [DiscordKeys.CUSTOM_ID]: (data as any)[DetritusKeys[DiscordKeys.CUSTOM_ID]] ?? (data as any)[DiscordKeys.CUSTOM_ID],
      [DiscordKeys.FILE_TYPES]: (data as any)[DetritusKeys[DiscordKeys.FILE_TYPES]] ?? (data as any)[DiscordKeys.FILE_TYPES],
      [DiscordKeys.MAX_VALUES]: (data as any)[DetritusKeys[DiscordKeys.MAX_VALUES]] ?? (data as any)[DiscordKeys.MAX_VALUES],
      [DiscordKeys.MIN_VALUES]: (data as any)[DetritusKeys[DiscordKeys.MIN_VALUES]] ?? (data as any)[DiscordKeys.MIN_VALUES],
    });
    this.merge(data);
    this.type = MessageComponentTypes.FILE_UPLOAD;
  }

  addFileType(fileType: string): this {
    if (this.fileTypes) {
      this.fileTypes.push(fileType);
    } else {
      this.fileTypes = [fileType];
    }
    return this;
  }

  setCustomId(customId: string): this {
    this.merge({custom_id: customId});
    return this;
  }

  setFileTypes(fileTypes: null | Array<string>): this {
    this.merge({file_types: fileTypes});
    return this;
  }

  setMaxValues(maxValues: null | number): this {
    this.merge({max_values: maxValues});
    return this;
  }

  setMinValues(minValues: null | number): this {
    this.merge({min_values: minValues});
    return this;
  }

  setRequired(required: boolean): this {
    this.merge({required});
    return this;
  }

  merge(data?: BaseStructureData): void {
    if (!data) {
      return;
    }

    if (DiscordKeys.CUSTOM_ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.CUSTOM_ID]] = data[DiscordKeys.CUSTOM_ID];
    }
    if (DiscordKeys.FILE_TYPES in data) {
      (this as any)[DetritusKeys[DiscordKeys.FILE_TYPES]] = data[DiscordKeys.FILE_TYPES];
    }
    if (DiscordKeys.ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.ID]] = data[DiscordKeys.ID];
    }
    if (DiscordKeys.MAX_VALUES in data) {
      (this as any)[DetritusKeys[DiscordKeys.MAX_VALUES]] = data[DiscordKeys.MAX_VALUES];
    }
    if (DiscordKeys.MIN_VALUES in data) {
      (this as any)[DetritusKeys[DiscordKeys.MIN_VALUES]] = data[DiscordKeys.MIN_VALUES];
    }
    if (DiscordKeys.REQUIRED in data) {
      (this as any)[DetritusKeys[DiscordKeys.REQUIRED]] = data[DiscordKeys.REQUIRED];
    }
    if (DiscordKeys.TYPE in data) {
      (this as any)[DetritusKeys[DiscordKeys.TYPE]] = data[DiscordKeys.TYPE];
    }
  }
}
