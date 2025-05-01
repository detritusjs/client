import {
  ApplicationCommandOptionTypes,
  ApplicationCommandTypes,
  DetritusKeys,
  DiscordKeys,
  InteractionCallbackTypes,
} from '../constants';

import { ShardClient } from '../client';
import { BaseCollection } from '../collections/basecollection';
import { BaseSet } from '../collections/baseset';
import {
  ChannelTypes,
  MessageComponentButtonStyles,
  MessageComponentDefaultValueTypes,
  MessageComponentTypes,
} from '../constants';

import {
  BaseStructure,
  BaseStructureData,
} from './basestructure';
import { Emoji } from './emoji';



export type ComponentsTopLevel = (
  ComponentActionRow | ComponentContainer | ComponentFile | ComponentMediaGallery | ComponentSection | ComponentSeparator | ComponentTextDisplay | ComponentUnknown
);


const keysComponentActionRow = new BaseSet<string>([
  DiscordKeys.COMPONENTS,
  DiscordKeys.TYPE,
]);

/**
 * Component Action Row Structure
 * @category Structure
 */
export class ComponentActionRow extends BaseStructure {
  readonly _uncloneable = true;
  readonly _keys = keysComponentActionRow;

  components = new BaseCollection<number, ComponentUnknown | ComponentButton | ComponentSelectMenu | ComponentInputText>();
  type: MessageComponentTypes = MessageComponentTypes.ACTION_ROW;

  constructor(
    client: ShardClient,
    data?: BaseStructureData,
    isClone?: boolean,
  ) {
    super(client, undefined, isClone);
    this.merge(data);
  }

  merge(data?: BaseStructureData): void {
    if (!data) {
      return;
    }

    if (DiscordKeys.COMPONENTS in data) {
      const value = data[DiscordKeys.COMPONENTS];

      this.components.clear();
      for (let i = 0; i < value.length; i++) {
        const raw = value[i];

        let component: ComponentUnknown | ComponentButton | ComponentSelectMenu | ComponentInputText;
        switch (raw.type) {
          case MessageComponentTypes.BUTTON: {
            component = new ComponentButton(this.client, raw, this._clone);
          }; break;
          case MessageComponentTypes.INPUT_TEXT: {
            component = new ComponentInputText(this.client, raw, this._clone);
          }; break;
          case MessageComponentTypes.SELECT_MENU:
          case MessageComponentTypes.USER_SELECT:
          case MessageComponentTypes.ROLE_SELECT:
          case MessageComponentTypes.MENTIONABLE_SELECT:
          case MessageComponentTypes.CHANNEL_SELECT: {
            component = new ComponentSelectMenu(this.client, raw, this._clone);
          }; break;
          default: {
            component = new ComponentUnknown(this.client, raw, this._clone);
          };
        }
        this.components.set(i, component);
      }
    }
    if (DiscordKeys.TYPE in data) {
      (this as any)[DetritusKeys[DiscordKeys.TYPE]] = data[DiscordKeys.TYPE];
    }
  }
}


const keysComponentUnknown = new BaseSet<string>([
  DiscordKeys.ID,
  DiscordKeys.TYPE,
]);

/**
 * Component Unknown Structure
 * @category Structure
 */
export class ComponentUnknown extends BaseStructure {
  readonly _uncloneable = true;
  readonly _keys = keysComponentUnknown;

  id?: number;
  type: MessageComponentTypes = MessageComponentTypes.BUTTON;

  constructor(
    client: ShardClient,
    data?: BaseStructureData,
    isClone?: boolean,
  ) {
    super(client, undefined, isClone);
    this.merge(data);
  }

  merge(data?: BaseStructureData): void {
    if (!data) {
      return;
    }

    if (DiscordKeys.ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.ID]] = data[DiscordKeys.ID];
    }
    if (DiscordKeys.TYPE in data) {
      (this as any)[DetritusKeys[DiscordKeys.TYPE]] = data[DiscordKeys.TYPE];
    }
  }
}


const keysComponentButton = new BaseSet<string>([
  DiscordKeys.CUSTOM_ID,
  DiscordKeys.DISABLED,
  DiscordKeys.EMOJI,
  DiscordKeys.LABEL,
  DiscordKeys.SKU_ID,
  DiscordKeys.STYLE,
  DiscordKeys.TYPE,
  DiscordKeys.URL,
]);

/**
 * Component Button Structure
 * @category Structure
 */
export class ComponentButton extends BaseStructure {
  readonly _uncloneable = true;
  readonly _keys = keysComponentButton;

  customId?: string;
  disabled?: boolean;
  emoji?: Emoji;
  label?: string;
  skuId?: string;
  style?: MessageComponentButtonStyles;
  type: MessageComponentTypes = MessageComponentTypes.BUTTON;
  url?: string;

  constructor(
    client: ShardClient,
    data?: BaseStructureData,
    isClone?: boolean,
  ) {
    super(client, undefined, isClone);
    this.merge(data);
  }

  get id(): string {
    return this.url || this.skuId || this.customId || '';
  }

  merge(data?: BaseStructureData): void {
    if (!data) {
      return;
    }
  
    if (DiscordKeys.CUSTOM_ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.CUSTOM_ID]] = data[DiscordKeys.CUSTOM_ID];
    }
    if (DiscordKeys.DISABLED in data) {
      (this as any)[DetritusKeys[DiscordKeys.DISABLED]] = data[DiscordKeys.DISABLED];
    }
    if (DiscordKeys.EMOJI in data) {
      const value = data[DiscordKeys.EMOJI];

      if (this.emoji) {
        this.emoji.merge(value);
      } else {
        this.emoji = new Emoji(this.client, value);
      }
    }
    if (DiscordKeys.LABEL in data) {
      (this as any)[DetritusKeys[DiscordKeys.LABEL]] = data[DiscordKeys.LABEL];
    }
    if (DiscordKeys.SKU_ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.SKU_ID]] = data[DiscordKeys.SKU_ID];
    }
    if (DiscordKeys.STYLE in data) {
      (this as any)[DetritusKeys[DiscordKeys.STYLE]] = data[DiscordKeys.STYLE];
    }
    if (DiscordKeys.TYPE in data) {
      (this as any)[DetritusKeys[DiscordKeys.TYPE]] = data[DiscordKeys.TYPE];
    }
    if (DiscordKeys.URL in data) {
      (this as any)[DetritusKeys[DiscordKeys.URL]] = data[DiscordKeys.URL];
    }
  }
}


const keysMessageComponentContainer = new BaseSet<string>([
  DiscordKeys.ACCENT_COLOR,
  DiscordKeys.COMPONENTS,
  DiscordKeys.ID,
  DiscordKeys.SPOILER,
  DiscordKeys.TYPE,
]);

/**
 * Component Container Structure
 * @category Structure
 */
export class ComponentContainer extends BaseStructure {
  readonly _uncloneable = true;
  readonly _keys = keysMessageComponentContainer;

  accentColor?: number;
  components = new BaseCollection<number, ComponentActionRow | ComponentFile | ComponentMediaGallery | ComponentSection | ComponentSeparator | ComponentTextDisplay | ComponentUnknown>();
  id?: number;
  spoiler?: boolean;
  type: MessageComponentTypes.CONTAINER = MessageComponentTypes.CONTAINER;

  constructor(
    client: ShardClient,
    data?: BaseStructureData,
    isClone?: boolean,
  ) {
    super(client, undefined, isClone);
    this.merge(data);
  }

  merge(data?: BaseStructureData): void {
    if (!data) {
      return;
    }

    if (DiscordKeys.ACCENT_COLOR in data) {
      (this as any)[DetritusKeys[DiscordKeys.ACCENT_COLOR]] = data[DiscordKeys.ACCENT_COLOR];
    }
    if (DiscordKeys.COMPONENTS in data) {
      const value = data[DiscordKeys.COMPONENTS];

      this.components.clear();
      for (let i = 0; i < value.length; i++) {
        const raw = value[i];

        let component: ComponentActionRow | ComponentFile | ComponentMediaGallery | ComponentSection | ComponentSeparator | ComponentTextDisplay | ComponentUnknown;
        switch (raw.type) {
          case MessageComponentTypes.ACTION_ROW: {
            component = new ComponentActionRow(this.client, raw, this._clone)
          }; break;
          case MessageComponentTypes.FILE: {
            component = new ComponentFile(this.client, raw, this._clone)
          }; break;
          case MessageComponentTypes.MEDIA_GALLERY: {
            component = new ComponentMediaGallery(this.client, raw, this._clone)
          }; break;
          case MessageComponentTypes.SECTION: {
            component = new ComponentSection(this.client, raw, this._clone)
          }; break;
          case MessageComponentTypes.SEPARATOR: {
            component = new ComponentSeparator(this.client, raw, this._clone)
          }; break;
          case MessageComponentTypes.TEXT_DISPLAY: {
            component = new ComponentTextDisplay(this.client, raw, this._clone)
          }; break;
          default: {
            component = new ComponentUnknown(this.client, raw, this._clone)
          };
        }
        this.components.set(i, component);
      }
    }
    if (DiscordKeys.ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.ID]] = data[DiscordKeys.ID];
    }
    if (DiscordKeys.SPOILER in data) {
      (this as any)[DetritusKeys[DiscordKeys.SPOILER]] = data[DiscordKeys.SPOILER];
    }
    if (DiscordKeys.TYPE in data) {
      (this as any)[DetritusKeys[DiscordKeys.TYPE]] = data[DiscordKeys.TYPE];
    }
  }
}


const keysMessageComponentFile = new BaseSet<string>([
  DiscordKeys.FILE,
  DiscordKeys.ID,
  DiscordKeys.SPOILER,
  DiscordKeys.TYPE,
]);

/**
 * Component File Structure
 * @category Structure
 */
export class ComponentFile extends BaseStructure {
  readonly _uncloneable = true;
  readonly _keys = keysMessageComponentFile;

  file!: ComponentUnfurledMedia;
  id?: number;
  spoiler?: number;
  type: MessageComponentTypes.FILE = MessageComponentTypes.FILE;

  constructor(
    client: ShardClient,
    data?: BaseStructureData,
    isClone?: boolean,
  ) {
    super(client, undefined, isClone);
    this.merge(data);
  }

  merge(data?: BaseStructureData): void {
    if (!data) {
      return;
    }

    if (DiscordKeys.FILE in data) {
      const value = data[DiscordKeys.FILE];
      (this as any)[DetritusKeys[DiscordKeys.FILE]] = new ComponentUnfurledMedia(this.client, value, this._clone);
    }
    if (DiscordKeys.ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.ID]] = data[DiscordKeys.ID];
    }
    if (DiscordKeys.SPOILER in data) {
      (this as any)[DetritusKeys[DiscordKeys.SPOILER]] = data[DiscordKeys.SPOILER];
    }
    if (DiscordKeys.TYPE in data) {
      (this as any)[DetritusKeys[DiscordKeys.TYPE]] = data[DiscordKeys.TYPE];
    }
  }
}


const keysMessageComponentInputText = new BaseSet<string>([
  DiscordKeys.CUSTOM_ID,
  DiscordKeys.TYPE,
  DiscordKeys.VALUE,
]);

/**
 * Component Input Text Structure
 * @category Structure
 */
export class ComponentInputText extends BaseStructure {
  readonly _uncloneable = true;
  readonly _keys = keysMessageComponentInputText;

  customId: string = '';
  type: MessageComponentTypes.INPUT_TEXT = MessageComponentTypes.INPUT_TEXT;
  value?: string;

  constructor(
    client: ShardClient,
    data?: BaseStructureData,
    isClone?: boolean,
  ) {
    super(client, undefined, isClone);
    this.merge(data);
  }

  get id(): string {
    return this.customId;
  }

  merge(data?: BaseStructureData): void {
    if (!data) {
      return;
    }
  
    if (DiscordKeys.CUSTOM_ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.CUSTOM_ID]] = data[DiscordKeys.CUSTOM_ID];
    }
    if (DiscordKeys.TYPE in data) {
      (this as any)[DetritusKeys[DiscordKeys.TYPE]] = data[DiscordKeys.TYPE];
    }
    if (DiscordKeys.VALUE in data) {
      (this as any)[DetritusKeys[DiscordKeys.VALUE]] = data[DiscordKeys.VALUE];
    }
  }
}


const keysMessageComponentMediaGallery = new BaseSet<string>([
  DiscordKeys.ID,
  DiscordKeys.ITEMS,
  DiscordKeys.TYPE,
]);

/**
 * Component Media Gallery Structure
 * @category Structure
 */
export class ComponentMediaGallery extends BaseStructure {
  readonly _uncloneable = true;
  readonly _keys = keysMessageComponentMediaGallery;

  id?: number;
  items = new BaseCollection<number, ComponentMediaGalleryItem>();
  type: MessageComponentTypes.MEDIA_GALLERY = MessageComponentTypes.MEDIA_GALLERY;

  constructor(
    client: ShardClient,
    data?: BaseStructureData,
    isClone?: boolean,
  ) {
    super(client, undefined, isClone);
    this.merge(data);
  }

  merge(data?: BaseStructureData): void {
    if (!data) {
      return;
    }

    if (DiscordKeys.ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.ID]] = data[DiscordKeys.ID];
    }
    if (DiscordKeys.ITEMS in data) {
      const value = data[DiscordKeys.ITEMS];

      this.items.clear();
      for (let i = 0; i < value.length; i++) {
        const item = new ComponentMediaGalleryItem(this, value[i]);
        this.items.set(i, item);
      }
    }
    if (DiscordKeys.TYPE in data) {
      (this as any)[DetritusKeys[DiscordKeys.TYPE]] = data[DiscordKeys.TYPE];
    }
  }
}


const keysComponentMediaGalleryItem = new BaseSet<string>([
  DiscordKeys.DESCRIPTION,
  DiscordKeys.MEDIA,
  DiscordKeys.SPOILER,
]);

/**
 * Component Media Gallery Item Structure
 * @category Structure
 */
export class ComponentMediaGalleryItem extends BaseStructure {
  readonly _uncloneable = true;
  readonly _keys = keysComponentMediaGalleryItem;
  readonly mediaGallery: ComponentMediaGallery;

  description?: string;
  media!: ComponentUnfurledMedia;
  spoiler?: boolean;

  constructor(mediaGallery: ComponentMediaGallery, data: BaseStructureData) {
    super(mediaGallery.client, undefined, mediaGallery._clone);
    this.mediaGallery = mediaGallery;
    this.merge(data);
    Object.defineProperty(this, 'mediaGallery', {enumerable: false});
  }

  merge(data?: BaseStructureData): void {
    if (!data) {
      return;
    }

    if (DiscordKeys.DESCRIPTION in data) {
      (this as any)[DetritusKeys[DiscordKeys.DESCRIPTION]] = data[DiscordKeys.DESCRIPTION];
    }
    if (DiscordKeys.MEDIA in data) {
      const value = data[DiscordKeys.MEDIA];
      (this as any)[DetritusKeys[DiscordKeys.MEDIA]] = new ComponentUnfurledMedia(this.client, value, this._clone);
    }
    if (DiscordKeys.SPOILER in data) {
      (this as any)[DetritusKeys[DiscordKeys.SPOILER]] = data[DiscordKeys.SPOILER];
    }
  }
}


const keysComponentSection = new BaseSet<string>([
  DiscordKeys.ACCESSORY,
  DiscordKeys.COMPONENTS,
  DiscordKeys.ID,
  DiscordKeys.TYPE,
]);

/**
 * Component Section Structure
 * @category Structure
 */
export class ComponentSection extends BaseStructure {
  readonly _uncloneable = true;
  readonly _keys = keysComponentSection;

  accessory!: ComponentButton | ComponentThumbnail | ComponentUnknown;
  components = new BaseCollection<number, ComponentTextDisplay | ComponentUnknown>();
  id?: number;
  type: MessageComponentTypes = MessageComponentTypes.SECTION;

  constructor(
    client: ShardClient,
    data?: BaseStructureData,
    isClone?: boolean,
  ) {
    super(client, undefined, isClone);
    this.merge(data);
  }

  merge(data?: BaseStructureData): void {
    if (!data) {
      return;
    }

    if (DiscordKeys.ACCESSORY in data) {
      const value = data[DiscordKeys.ACCESSORY];

      let component: ComponentButton | ComponentThumbnail | ComponentUnknown;
      switch (value.type) {
        case MessageComponentTypes.BUTTON: {
          component = new ComponentButton(this.client, value, this._clone)
        }; break;
        case MessageComponentTypes.THUMBNAIL: {
          component = new ComponentThumbnail(this.client, value, this._clone)
        }; break;
        default: {
          component = new ComponentUnknown(this.client, value, this._clone)
        };
      }
      (this as any)[DetritusKeys[DiscordKeys.ACCESSORY]] = component;
    }
    if (DiscordKeys.COMPONENTS in data) {
      const value = data[DiscordKeys.COMPONENTS];

      this.components.clear();
      for (let i = 0; i < value.length; i++) {
        const raw = value[i];

        let component: ComponentTextDisplay | ComponentUnknown;
        switch (raw.type) {
          case MessageComponentTypes.TEXT_DISPLAY: {
            component = new ComponentTextDisplay(this.client, raw, this._clone)
          }; break;
          default: {
            component = new ComponentUnknown(this.client, raw, this._clone)
          };
        }
        this.components.set(i, component);
      }
    }
    if (DiscordKeys.ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.ID]] = data[DiscordKeys.ID];
    }
    if (DiscordKeys.TYPE in data) {
      (this as any)[DetritusKeys[DiscordKeys.TYPE]] = data[DiscordKeys.TYPE];
    }
    if (DiscordKeys.VALUE in data) {
      (this as any)[DetritusKeys[DiscordKeys.VALUE]] = data[DiscordKeys.VALUE];
    }
  }
}


const keysMessageComponentSelectMenu = new BaseSet<string>([
  DiscordKeys.CHANNEL_TYPES,
  DiscordKeys.CUSTOM_ID,
  DiscordKeys.DEFAULT_VALUES,
  DiscordKeys.DISABLED,
  DiscordKeys.MAX_VALUES,
  DiscordKeys.MIN_VALUES,
  DiscordKeys.OPTIONS,
  DiscordKeys.PLACEHOLDER,
  DiscordKeys.TYPE,
]);

/**
 * Component Select Menu Structure
 * @category Structure
 */
export class ComponentSelectMenu extends BaseStructure {
  readonly _uncloneable = true;
  readonly _keys = keysMessageComponentSelectMenu;

  channelTypes?: Array<ChannelTypes>;
  customId: string = '';
  defaultValues?: BaseCollection<string, ComponentSelectMenuDefaultValue>;
  disabled?: boolean;
  maxValues: number = 1;
  minValues: number = 1;
  options = new BaseCollection<string, ComponentSelectMenuOption>();
  placeholder: string = '';
  type: (
    MessageComponentTypes.SELECT_MENU | MessageComponentTypes.USER_SELECT |
    MessageComponentTypes.ROLE_SELECT | MessageComponentTypes.MENTIONABLE_SELECT |
    MessageComponentTypes.CHANNEL_SELECT
  ) = MessageComponentTypes.SELECT_MENU;

  constructor(
    client: ShardClient,
    data?: BaseStructureData,
    isClone?: boolean,
  ) {
    super(client, undefined, isClone);
    this.merge(data);
  }

  get id(): string {
    return this.customId;
  }

  merge(data?: BaseStructureData): void {
    if (!data) {
      return;
    }

    if (DiscordKeys.CHANNEL_TYPES in data) {
      (this as any)[DetritusKeys[DiscordKeys.CHANNEL_TYPES]] = data[DiscordKeys.CHANNEL_TYPES];
    }
    if (DiscordKeys.CUSTOM_ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.CUSTOM_ID]] = data[DiscordKeys.CUSTOM_ID];
    }
    if (DiscordKeys.DEFAULT_VALUES in data) {
      const value = data[DiscordKeys.DEFAULT_VALUES];

      if (value) {
        if (!this.defaultValues) {
          this.defaultValues = new BaseCollection<string, ComponentSelectMenuDefaultValue>();
        }
        this.defaultValues.clear();
        for (let raw of value) {
          const defaultValue = new ComponentSelectMenuDefaultValue(this, raw);
          this.defaultValues.set(defaultValue.key, defaultValue);
        }
      } else {
        if (this.defaultValues) {
          this.defaultValues.clear();
          this.defaultValues = undefined;
        }
      }
    }
    if (DiscordKeys.DISABLED in data) {
      (this as any)[DetritusKeys[DiscordKeys.DISABLED]] = data[DiscordKeys.DISABLED];
    }
    if (DiscordKeys.MAX_VALUES in data) {
      (this as any)[DetritusKeys[DiscordKeys.MAX_VALUES]] = data[DiscordKeys.MAX_VALUES];
    }
    if (DiscordKeys.MIN_VALUES in data) {
      (this as any)[DetritusKeys[DiscordKeys.MIN_VALUES]] = data[DiscordKeys.MIN_VALUES];
    }
    if (DiscordKeys.OPTIONS in data) {
      const value = data[DiscordKeys.OPTIONS];

      this.options.clear();
      for (let raw of value) {
        const option = new ComponentSelectMenuOption(this, raw);
        this.options.set(option.label, option);
      }
    }
    if (DiscordKeys.PLACEHOLDER in data) {
      (this as any)[DetritusKeys[DiscordKeys.PLACEHOLDER]] = data[DiscordKeys.PLACEHOLDER];
    }
    if (DiscordKeys.TYPE in data) {
      (this as any)[DetritusKeys[DiscordKeys.TYPE]] = data[DiscordKeys.TYPE];
    }
  }
}


const keysComponentSelectMenuDefaultValue = new BaseSet<string>([
  DiscordKeys.ID,
  DiscordKeys.TYPE,
]);

/**
 * Component Select Menu Default Value Structure
 * @category Structure
 */
export class ComponentSelectMenuDefaultValue extends BaseStructure {
  readonly _uncloneable = true;
  readonly _keys = keysComponentSelectMenuDefaultValue;
  readonly selectMenu: ComponentSelectMenu;

  id: string = '';
  type!: MessageComponentDefaultValueTypes;

  get key(): string {
    return `${this.id}-${this.type}`;
  }

  constructor(selectMenu: ComponentSelectMenu, data: BaseStructureData) {
    super(selectMenu.client, undefined, selectMenu._clone);
    this.selectMenu = selectMenu;
    this.merge(data);
    Object.defineProperty(this, 'selectMenu', {enumerable: false});
  }

  merge(data?: BaseStructureData): void {
    if (!data) {
      return;
    }

    if (DiscordKeys.ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.ID]] = data[DiscordKeys.ID];
    }
    if (DiscordKeys.TYPE in data) {
      (this as any)[DetritusKeys[DiscordKeys.TYPE]] = data[DiscordKeys.TYPE];
    }
  }
}


const keysComponentSelectMenuOption = new BaseSet<string>([
  DiscordKeys.DEFAULT,
  DiscordKeys.DESCRIPTION,
  DiscordKeys.EMOJI,
  DiscordKeys.LABEL,
  DiscordKeys.VALUE,
]);

/**
 * Component Select Menu Option Structure
 * @category Structure
 */
export class ComponentSelectMenuOption extends BaseStructure {
  readonly _uncloneable = true;
  readonly _keys = keysComponentSelectMenuOption;
  readonly selectMenu: ComponentSelectMenu;

  default: boolean = false;
  description?: string;
  emoji?: Emoji;
  label: string = '';
  value: string = '';

  constructor(selectMenu: ComponentSelectMenu, data: BaseStructureData) {
    super(selectMenu.client, undefined, selectMenu._clone);
    this.selectMenu = selectMenu;
    this.merge(data);
    Object.defineProperty(this, 'selectMenu', {enumerable: false});
  }

  merge(data?: BaseStructureData): void {
    if (!data) {
      return;
    }
  
    if (DiscordKeys.DEFAULT in data) {
      (this as any)[DetritusKeys[DiscordKeys.DEFAULT]] = data[DiscordKeys.DEFAULT];
    }
    if (DiscordKeys.DESCRIPTION in data) {
      (this as any)[DetritusKeys[DiscordKeys.DESCRIPTION]] = data[DiscordKeys.DESCRIPTION];
    }
    if (DiscordKeys.EMOJI in data) {
      const value = data[DiscordKeys.EMOJI];

      if (this.emoji) {
        this.emoji.merge(value);
      } else {
        this.emoji = new Emoji(this.client, value);
      }
    }
    if (DiscordKeys.LABEL in data) {
      (this as any)[DetritusKeys[DiscordKeys.LABEL]] = data[DiscordKeys.LABEL];
    }
    if (DiscordKeys.VALUE in data) {
      (this as any)[DetritusKeys[DiscordKeys.VALUE]] = data[DiscordKeys.VALUE];
    }
  }
}


const keysMessageComponentSeparator = new BaseSet<string>([
  DiscordKeys.DIVIDER,
  DiscordKeys.ID,
  DiscordKeys.SPACING,
  DiscordKeys.TYPE,
]);

/**
 * Component Separator Structure
 * @category Structure
 */
export class ComponentSeparator extends BaseStructure {
  readonly _uncloneable = true;
  readonly _keys = keysMessageComponentSeparator;

  divider?: boolean;
  id?: number;
  spacing?: number;
  type: MessageComponentTypes.SEPARATOR = MessageComponentTypes.SEPARATOR;

  constructor(
    client: ShardClient,
    data?: BaseStructureData,
    isClone?: boolean,
  ) {
    super(client, undefined, isClone);
    this.merge(data);
  }

  merge(data?: BaseStructureData): void {
    if (!data) {
      return;
    }

    if (DiscordKeys.DIVIDER in data) {
      (this as any)[DetritusKeys[DiscordKeys.DIVIDER]] = data[DiscordKeys.DIVIDER];
    }
    if (DiscordKeys.ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.ID]] = data[DiscordKeys.ID];
    }
    if (DiscordKeys.SPACING in data) {
      (this as any)[DetritusKeys[DiscordKeys.SPACING]] = data[DiscordKeys.SPACING];
    }
    if (DiscordKeys.TYPE in data) {
      (this as any)[DetritusKeys[DiscordKeys.TYPE]] = data[DiscordKeys.TYPE];
    }
  }
}


const keysMessageComponentTextDisplay = new BaseSet<string>([
  DiscordKeys.CONTENT,
  DiscordKeys.ID,
  DiscordKeys.TYPE,
]);

/**
 * Component Text Display Structure
 * @category Structure
 */
export class ComponentTextDisplay extends BaseStructure {
  readonly _uncloneable = true;
  readonly _keys = keysMessageComponentTextDisplay;

  content: string = '';
  id?: number;
  type: MessageComponentTypes.TEXT_DISPLAY = MessageComponentTypes.TEXT_DISPLAY;

  constructor(
    client: ShardClient,
    data?: BaseStructureData,
    isClone?: boolean,
  ) {
    super(client, undefined, isClone);
    this.merge(data);
  }

  merge(data?: BaseStructureData): void {
    if (!data) {
      return;
    }

    if (DiscordKeys.CONTENT in data) {
      (this as any)[DetritusKeys[DiscordKeys.CONTENT]] = data[DiscordKeys.CONTENT];
    }
    if (DiscordKeys.ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.ID]] = data[DiscordKeys.ID];
    }
    if (DiscordKeys.TYPE in data) {
      (this as any)[DetritusKeys[DiscordKeys.TYPE]] = data[DiscordKeys.TYPE];
    }
  }
}


const keysMessageComponentThumbnail = new BaseSet<string>([
  DiscordKeys.DESCRIPTION,
  DiscordKeys.ID,
  DiscordKeys.MEDIA,
  DiscordKeys.SPOILER,
  DiscordKeys.TYPE,
]);

/**
 * Component Thumbnail Structure
 * @category Structure
 */
export class ComponentThumbnail extends BaseStructure {
  readonly _uncloneable = true;
  readonly _keys = keysMessageComponentThumbnail;

  description?: string;
  id?: number;
  media!: ComponentUnfurledMedia;
  spoiler?: boolean;
  type: MessageComponentTypes.THUMBNAIL = MessageComponentTypes.THUMBNAIL;

  constructor(
    client: ShardClient,
    data?: BaseStructureData,
    isClone?: boolean,
  ) {
    super(client, undefined, isClone);
    this.merge(data);
  }

  merge(data?: BaseStructureData): void {
    if (!data) {
      return;
    }

    if (DiscordKeys.DESCRIPTION in data) {
      (this as any)[DetritusKeys[DiscordKeys.DESCRIPTION]] = data[DiscordKeys.DESCRIPTION];
    }
    if (DiscordKeys.ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.ID]] = data[DiscordKeys.ID];
    }
    if (DiscordKeys.MEDIA in data) {
      const value = data[DiscordKeys.MEDIA];
      (this as any)[DetritusKeys[DiscordKeys.MEDIA]] = new ComponentUnfurledMedia(this.client, value, this._clone);
    }
    if (DiscordKeys.SPOILER in data) {
      (this as any)[DetritusKeys[DiscordKeys.SPOILER]] = data[DiscordKeys.SPOILER];
    }
    if (DiscordKeys.TYPE in data) {
      (this as any)[DetritusKeys[DiscordKeys.TYPE]] = data[DiscordKeys.TYPE];
    }
  }
}


const keysMessageComponentUnfurledMedia = new BaseSet<string>([
  DiscordKeys.CONTENT_TYPE,
  DiscordKeys.HEIGHT,
  DiscordKeys.PROXY_URL,
  DiscordKeys.URL,
  DiscordKeys.WIDTH,
]);

/**
 * Component Unfurled Media Structure
 * @category Structure
 */
export class ComponentUnfurledMedia extends BaseStructure {
  readonly _uncloneable = true;
  readonly _keys = keysMessageComponentUnfurledMedia;

  contentType?: string;
  height?: number;
  proxyUrl?: string;
  url: string = '';
  width?: number;

  constructor(
    client: ShardClient,
    data?: BaseStructureData,
    isClone?: boolean,
  ) {
    super(client, undefined, isClone);
    this.merge(data);
  }

  merge(data?: BaseStructureData): void {
    if (!data) {
      return;
    }

    if (DiscordKeys.CONTENT_TYPE in data) {
      (this as any)[DetritusKeys[DiscordKeys.CONTENT_TYPE]] = data[DiscordKeys.CONTENT_TYPE];
    }
    if (DiscordKeys.HEIGHT in data) {
      (this as any)[DetritusKeys[DiscordKeys.HEIGHT]] = data[DiscordKeys.HEIGHT];
    }
    if (DiscordKeys.PROXY_URL in data) {
      (this as any)[DetritusKeys[DiscordKeys.PROXY_URL]] = data[DiscordKeys.PROXY_URL];
    }
    if (DiscordKeys.URL in data) {
      (this as any)[DetritusKeys[DiscordKeys.URL]] = data[DiscordKeys.URL];
    }
    if (DiscordKeys.WIDTH in data) {
      (this as any)[DetritusKeys[DiscordKeys.WIDTH]] = data[DiscordKeys.WIDTH];
    }
  }
}
