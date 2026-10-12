import { ApplicationCommandTypes } from '../constants';
import type {
  InteractionCommand,
  InteractionCommandOption,
  InteractionCommandOptionChoice,
} from '../interaction';
import type {
  ApplicationCommand,
  ApplicationCommandOption,
  ApplicationCommandOptionChoice,
} from '../structures/applicationcommand';


export type ApplicationCommandLike = ApplicationCommand | InteractionCommand;
export type ApplicationCommandOptionLike = ApplicationCommandOption | InteractionCommandOption;
export type ApplicationCommandOptionChoiceLike = ApplicationCommandOptionChoice | InteractionCommandOptionChoice;

export interface NormalizeApplicationCommandOptions {
  // guild commands ignore `contexts`, `dm_permission` and `integration_types`, so they aren't compared
  isGuild?: boolean,
}


function normalizeLocalizations(value?: Record<string, string | undefined> | null): Record<string, string> | null {
  if (!value) {
    return null;
  }
  const keys = Object.keys(value).filter((key) => value[key] !== undefined && value[key] !== null).sort();
  if (!keys.length) {
    return null;
  }
  const localizations: Record<string, string> = {};
  for (let key of keys) {
    localizations[key] = value[key]!;
  }
  return localizations;
}

function normalizeNumber(value?: bigint | number | string | null): string | null {
  if (value === undefined || value === null) {
    return null;
  }
  return String(value);
}

function normalizeUnorderedArray<T>(value?: Array<T> | null): Array<T> | null {
  if (!value || !value.length) {
    return null;
  }
  // copy so we never reorder the command's own array
  return [...value].sort();
}


/**
 * Converts a local or remote command into the same plain payload shape, with defaults filled in and
 * empty values collapsed, so that two equivalent commands produce deeply-equal objects
 */
export function normalizeApplicationCommand(
  command: ApplicationCommandLike,
  options: NormalizeApplicationCommandOptions = {},
): Record<string, any> {
  const permissions = command.defaultMemberPermissions;
  const data: Record<string, any> = {
    default_member_permissions: (permissions === undefined || permissions === null) ? null : String(permissions),
    description: command.description || '',
    description_localizations: normalizeLocalizations(command.descriptionLocalizations),
    name: command.name,
    name_localizations: normalizeLocalizations(command.nameLocalizations),
    nsfw: !!command.nsfw,
    options: (command.options) ? command.options.map(normalizeApplicationCommandOption) : [],
    type: command.type || ApplicationCommandTypes.CHAT_INPUT,
  };
  if (!options.isGuild) {
    data.contexts = normalizeUnorderedArray(command.contexts);
    data.dm_permission = (command.dmPermission === undefined || command.dmPermission === null) ? true : !!command.dmPermission;
    data.integration_types = normalizeUnorderedArray(command.integrationTypes);
  }
  return data;
}

export function normalizeApplicationCommandOption(option: ApplicationCommandOptionLike): Record<string, any> {
  return {
    autocomplete: !!option.autocomplete,
    channel_types: normalizeUnorderedArray(option.channelTypes),
    choices: (option.choices) ? option.choices.map(normalizeApplicationCommandOptionChoice) : [],
    description: option.description || '',
    description_localizations: normalizeLocalizations(option.descriptionLocalizations),
    max_length: normalizeNumber(option.maxLength),
    max_value: normalizeNumber(option.maxValue),
    min_length: normalizeNumber(option.minLength),
    min_value: normalizeNumber(option.minValue),
    name: option.name,
    name_localizations: normalizeLocalizations(option.nameLocalizations),
    options: (option.options) ? option.options.map(normalizeApplicationCommandOption) : [],
    required: !!option.required,
    type: option.type,
  };
}

export function normalizeApplicationCommandOptionChoice(choice: ApplicationCommandOptionChoiceLike): Record<string, any> {
  return {
    name: choice.name,
    name_localizations: normalizeLocalizations(choice.nameLocalizations),
    // `1` and `'1'` are different choices, so the value is compared strictly
    value: choice.value,
  };
}


/**
 * Deep compares two normalized payloads, returning the paths that differ (e.g. `options[0:user].description`)
 */
export function diffNormalized(a: any, b: any, path: string = ''): Array<string> {
  if (a === b) {
    return [];
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    const differences: Array<string> = [];
    const length = Math.max(a.length, b.length);
    for (let i = 0; i < length; i++) {
      const item = (i < a.length) ? a[i] : b[i];
      const label = (item && typeof(item) === 'object' && typeof(item.name) === 'string') ? `${i}:${item.name}` : String(i);
      if (i >= a.length || i >= b.length) {
        differences.push(`${path}[${label}]`);
      } else {
        differences.push(...diffNormalized(a[i], b[i], `${path}[${label}]`));
      }
    }
    return differences;
  }
  if (
    a && b &&
    typeof(a) === 'object' && typeof(b) === 'object' &&
    !Array.isArray(a) && !Array.isArray(b)
  ) {
    const differences: Array<string> = [];
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (let key of Array.from(keys).sort()) {
      differences.push(...diffNormalized(a[key], b[key], (path) ? `${path}.${key}` : key));
    }
    return differences;
  }
  return [path || '(root)'];
}

/**
 * Returns the fields that differ between our local command and the one Discord has stored, empty if they match
 */
export function diffApplicationCommands(
  local: InteractionCommand,
  remote: ApplicationCommand,
  options: NormalizeApplicationCommandOptions = {},
): Array<string> {
  // `toJSON()` fills in `defaultMemberPermissions` and `dmPermission` from `permissions`/`disableDm`
  local.toJSON();
  const localData = normalizeApplicationCommand(local, options);
  const remoteData = normalizeApplicationCommand(remote, options);
  if (!options.isGuild && localData.integration_types === null) {
    // we let discord pick the default and copy it over afterwards
    remoteData.integration_types = null;
  }
  return diffNormalized(localData, remoteData);
}
