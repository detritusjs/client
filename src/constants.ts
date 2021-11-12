import { Endpoints } from 'detritus-client-rest';
import { Tools } from 'detritus-utils';

export {
  AuthTypes,
  DiscordAbortCodes,
  HTTPMethods,
} from 'detritus-client-rest/lib/constants';

export {
  CompressTypes,
  EncodingTypes,
  GatewayActivityActionTypes as ActivityActionTypes,
  GatewayActivityFlags as ActivityFlags,
  GatewayActivityTypes as ActivityTypes,
  GatewayDispatchEvents,
  GatewayIntents,
  GatewayOpCodes,
  GatewayPresenceStatuses as PresenceStatuses,
  MediaCodecs,
  MediaCodecTypes,
  MediaOpCodes,
  MediaSpeakingFlags as SpeakingFlags,
  SocketCloseCodes,
  SocketGatewayCloseCodes,
  SocketMediaCloseCodes,
  SocketStates,
  DEFAULT_SHARD_LAUNCH_DELAY,
} from 'detritus-client-socket/lib/constants';

export {
  DISCORD_SNOWFLAKE_EPOCH,
  DISCORD_TOKEN_EPOCH,
} from 'detritus-utils/lib/constants';


export const Package = Object.freeze({
  URL: 'https://github.com/detritusjs/client',
  VERSION: '0.16.4-beta.6',
});

export type Snowflake = number | string;


let isImportAvailable = false;
try {
  import('detritus-utils');
} catch(error) {
  if (error.name === 'SyntaxError') {
    isImportAvailable = true;
  }
}

export const IS_TS_NODE = Symbol.for('ts-node.register.instance') in process;
export const IS_IMPORT_AVAILABLE = isImportAvailable;

export const DEFAULT_MAX_MEMBERS = 250000;
export const DEFAULT_MAX_PRESENCES = 5000;
export const DEFAULT_MAX_VIDEO_CHANNEL_USERS = 25;

export const FILE_EXTENSIONS_IMPORT = ['.js', '.cjs', '.mjs'];
if (IS_TS_NODE) {
  FILE_EXTENSIONS_IMPORT.push('.ts');
}

export const LOCAL_GUILD_ID = '@me';

export const MAX_ACTION_ROW_BUTTONS = 5;
export const MAX_ACTION_ROW_SELECT_MENUS = 1;
export const MAX_ATTACHMENT_SIZE = 8 * 1024 * 1024;
export const MAX_ATTACHMENT_SIZE_PREMIUM = 50 * 1024 * 1024;
export const MAX_BITRATE = 96000;
export const MAX_EMOJI_SIZE = 256000;
export const MAX_EMOJI_SLOTS = 50;
export const MAX_EMOJI_SLOTS_MORE = 200;

export const MAX_LENGTH_CONTENT = 4000;
export const MAX_LENGTH_EMBED_AUTHOR_NAME = 256;
export const MAX_LENGTH_EMBED_DESCRIPTION = 4096;
export const MAX_LENGTH_EMBED_FIELD_NAME = 256;
export const MAX_LENGTH_EMBED_FIELD_VALUE = 1024;
export const MAX_LENGTH_EMBED_FOOTER_TEXT = 2048;
export const MAX_LENGTH_EMBED_TITLE = 256;

export const MIN_BITRATE = 8000;

export const MEDIA_ATTACHMENT_URL_PREFIX = Endpoints.Urls.MEDIA + 'attachments/';
export const MEDIA_SIZES = Object.freeze([16, 20, 32, 40, 64, 80, 128, 160, 256, 320, 512, 640, 1024, 1280, 1536, 2048, 3072, 4096]);
export const SPOILER_ATTACHMENT_PREFIX = 'SPOILER_';

export const INTERACTION_TIMEOUT = 15 * 60 * 1000; // 15 minutes
export const TYPING_TIMEOUT = 10 * 1000; // 10 seconds


export enum ApplicationCommandTypes {
  CHAT_INPUT = 1,
  USER = 2,
  MESSAGE = 3,
}


export enum ApplicationCommandOptionTypes {
  SUB_COMMAND = 1,
  SUB_COMMAND_GROUP = 2,
  STRING = 3,
  INTEGER = 4,
  BOOLEAN = 5,
  USER = 6,
  CHANNEL = 7,
  ROLE = 8,
  MENTIONABLE = 9,
}


export enum ApplicationCommandPermissionTypes {
  ROLE = 1,
  USER = 2,
}


export enum ApplicationFlags {
  MANAGED_EMOJI = 1 << 2,

  GROUP_DM_CREATE = 1 << 4,

  RPC_HAS_CONNECTED = 1 << 11,
  GATEWAY_PRESENCE = 1 << 12,
  GATEWAY_PRESENCE_LIMITED = 1 << 13,
  GATEWAY_GUILD_MEMBERS = 1 << 14,
  GATEWAY_GUILD_MEMBERS_LIMITED = 1 << 15,
  VERIFICATION_PENDING_GUILD_LIMIT = 1 << 16,
  EMBEDDED = 1 << 17,
  GATEWAY_MESSAGE_CONTENT = 1 << 18,
  GATEWAY_MESSAGE_CONTENT_LIMITED = 1 << 19,
}


export enum ApplicationNewsFlags {
  PATCH_NOTES = 1 << 1,
  PROMOTION = 1 << 2,
}


export enum ApplicationTypes {
  GAME = 1,
  MUSIC = 2,
}


export enum ActivityPartyPrivacy {
  PRIVATE = 0,
  PUBLIC = 1,
}


export enum ActivityPlatformTypes {
  ANDROID = 'android',
  DESKTOP = 'desktop',
  EMBEDDED = 'embedded',
  IOS = 'ios',
  SAMSUNG = 'samsung',
  XBOX = 'xbox',
}


export enum AuditLogActions {
  GUILD_UPDATE = 1,

  CHANNEL_CREATE = 10,
  CHANNEL_UPDATE = 11,
  CHANNEL_DELETE = 12,
  CHANNEL_OVERWRITE_CREATE = 13,
  CHANNEL_OVERWRITE_UPDATE = 14,
  CHANNEL_OVERWRITE_DELETE = 15,

  MEMBER_KICK = 20,
  MEMBER_PRUNE = 21,
  MEMBER_BAN_ADD = 22,
  MEMBER_BAN_REMOVE = 23,
  MEMBER_UPDATE = 24,
  MEMBER_ROLE_UPDATE = 25,
  MEMBER_MOVE = 26,
  MEMBER_DISCONNECT = 27,
  BOT_ADD = 28,

  ROLE_CREATE = 30,
  ROLE_UPDATE = 31,
  ROLE_DELETE = 32,

  INVITE_CREATE = 40,
  INVITE_UPDATE = 41,
  INVITE_DELETE = 42,

  WEBHOOK_CREATE = 50,
  WEBHOOK_UPDATE = 51,
  WEBHOOK_DELETE = 52,

  EMOJI_CREATE = 60,
  EMOJI_UPDATE = 61,
  EMOJI_DELETE = 62,

  MESSAGE_DELETE = 72,
  MESSAGE_BULK_DELETE = 73,
  MESSAGE_PIN = 74,
  MESSAGE_UNPIN = 75,

  INTEGRATION_CREATE = 80,
  INTEGRATION_UPDATE = 81,
  INTEGRATION_DELETE = 82,
  STAGE_INSTANCE_CREATE = 83,
  STAGE_INSTANCE_UPDATE = 84,
  STAGE_INSTANCE_DELETE = 85,

  STICKER_CREATE = 90,
  STICKER_UPDATE = 91,
  STICKER_DELETE = 92,
}


export const AuditLogActionTypes = Tools.normalize({
  ALL: null,
  CREATE: null,
  UPDATE: null,
  DELETE: null,
});


export const AuditLogSubtargetTypes = Object.freeze({
  USER: 'member',
  ROLE: 'role',
});


export const AuditLogTargetTypes = Tools.normalize({
  ALL: null,
  CHANNEL: null,
  CHANNEL_OVERWRITE: null,
  EMOJI: null,
  GUILD: null,
  INTEGRATION: null,
  INVITE: null,
  ROLE: null,
  UNKNOWN: null,
  USER: null,
  WEBHOOK: null,
});


export enum AuditLogChangeKeys {
  AFK_CHANNEL_ID = 'afk_channel_id',
  AFK_TIMEOUT = 'afk_timeout',
  ALLOW = 'allow',
  ALLOW_NEW = 'allow_new',
  APPLICATION_ID = 'application_id',
  AVATAR_HASH = 'avatar_hash',
  BANNER_HASH = 'banner_hash',
  BITRATE = 'bitrate',
  CHANNEL_ID = 'channel_id',
  CODE = 'code',
  COLOR = 'color',
  DEAF = 'deaf',
  DEFAULT_MESSAGE_NOTIFICATIONS = 'default_message_notifications',
  DENY = 'deny',
  DENY_NEW = 'deny_new',
  DESCRIPTION = 'description',
  ENABLE_EMOTICONS = 'enable_emoticons',
  EXPIRE_BEHAVIOR = 'expire_behavior',
  EXPIRE_GRACE_PERIOD = 'expire_grace_period',
  EXPLICIT_CONTENT_FILTER = 'explicit_content_filter',
  HOIST = 'hoist',
  ICON_HASH = 'icon_hash',
  ID = 'id',
  INVITER_ID = 'inviter_id',
  MAX_AGE = 'max_age',
  MAX_USES = 'max_uses',
  MENTIONABLE = 'mentionable',
  MFA_LEVEL = 'mfa_level',
  MUTE = 'mute',
  NAME = 'name',
  NICK = 'nick',
  NSFW = 'nsfw',
  OWNER_ID = 'owner_id',
  PERMISSION_OVERWRITES = 'permission_overwrites',
  PERMISSIONS = 'permissions',

  PERMISSIONS_DENIED = 'deny',
  PERMISSIONS_GRANTED = 'allow',
  PERMISSIONS_RESET = 'reset',

  POSITION = 'position',
  PREFERRED_LOCALE = 'preferred_locale',
  PRUNE_DELETE_DAYS = 'prune_delete_days',
  RATE_LIMIT_PER_USER = 'rate_limit_per_user',
  REASON = 'reason',
  REGION = 'region',
  ROLES_ADD = '$add',
  ROLES_REMOVE = '$remove',
  SPLASH_HASH = 'splash_hash',
  SYSTEM_CHANNEL_ID = 'system_channel_id',
  WIDGET_CHANNEL_ID = 'widget_channel_id',
  WIDGET_ENABLED = 'widget_enabled',
  VANITY_URL_CODE = 'vanity_url_code',
  VIDEO_QUALITY_MODE = 'video_quality_mode',
  VERIFICATION_LEVEL = 'verification_level',
  TEMPORARY = 'temporary',
  TOPIC = 'topic',
  TYPE = 'type',
  USES = 'uses',
}


export enum CarouselMediaTypes {
  IMAGE = 1,
  YOUTUBE_VIDEO = 2,
  VIDEO = 3,
}


export enum ChannelTypes {
  BASE = -1,
  GUILD_TEXT = 0,
  DM = 1,
  GUILD_VOICE = 2,
  GROUP_DM = 3,
  GUILD_CATEGORY = 4,
  GUILD_NEWS = 5,
  GUILD_STORE = 6,

  GUILD_NEWS_THREAD = 10,
  GUILD_PUBLIC_THREAD = 11,
  GUILD_PRIVATE_THREAD = 12,
  GUILD_STAGE_VOICE = 13,
  GUILD_DIRECTORY = 14,
}


export enum ChannelVideoQualityModes {
  AUTO = 1,
  FULL = 2,
}


export enum ClientEvents {
  ACTIVITY_JOIN_INVITE = 'activityJoinInvite',
  ACTIVITY_JOIN_REQUEST = 'activityJoinRequest',
  ACTIVITY_START = 'activityStart',
  APPLICATION_COMMAND_CREATE = 'applicationCommandCreate',
  APPLICATION_COMMAND_DELETE = 'applicationCommandDelete',
  APPLICATION_COMMAND_UPDATE = 'applicationCommandUpdate',
  BRAINTREE_POPUP_BRIDGE_CALLBACK = 'braintreePopupBridgeCallback',
  CALL_CREATE = 'callCreate',
  CALL_DELETE = 'callDelete',
  CALL_UPDATE = 'callUpdate',
  CHANNEL_CREATE = 'channelCreate',
  CHANNEL_DELETE = 'channelDelete',
  CHANNEL_UPDATE = 'channelUpdate',
  CHANNEL_PINS_ACK = 'channelPinsAck',
  CHANNEL_PINS_UPDATE = 'channelPinsUpdate',
  CHANNEL_RECIPIENT_ADD = 'channelRecipientAdd',
  CHANNEL_RECIPIENT_REMOVE = 'channelRecipientRemove',
  ENTITLEMENT_CREATE = 'entitlementCreate',
  ENTITLEMENT_DELETE = 'entitlementDelete',
  ENTITLEMENT_UPDATE = 'entitlementUpdate',
  FRIEND_SUGGESTION_CREATE = 'friendSuggestionCreate',
  FRIEND_SUGGESTION_DELETE = 'friendSuggestionDelete',
  GIFT_CODE_UPDATE = 'giftCodeUpdate',
  GUILD_BAN_ADD = 'guildBanAdd',
  GUILD_BAN_REMOVE = 'guildBanRemove',
  GUILD_CREATE = 'guildCreate',
  GUILD_DELETE = 'guildDelete',
  GUILD_EMOJIS_UPDATE = 'guildEmojisUpdate',
  GUILD_INTEGRATIONS_UPDATE = 'guildIntegrationsUpdate',
  GUILD_MEMBER_ADD = 'guildMemberAdd',
  GUILD_MEMBER_LIST_UPDATE = 'guildMemberListUpdate',
  GUILD_MEMBER_REMOVE = 'guildMemberRemove',
  GUILD_MEMBER_UPDATE = 'guildMemberUpdate',
  GUILD_MEMBERS_CHUNK = 'guildMembersChunk',
  GUILD_READY = 'guildReady',
  GUILD_ROLE_CREATE = 'guildRoleCreate',
  GUILD_ROLE_DELETE = 'guildRoleDelete',
  GUILD_ROLE_UPDATE = 'guildRoleUpdate',
  GUILD_STICKERS_UPDATE = 'guildStickersUpdate',
  GUILD_UPDATE = 'guildUpdate',
  INTERACTION_CREATE = 'interactionCreate',
  INVITE_CREATE = 'inviteCreate',
  INVITE_DELETE = 'inviteDelete',
  LIBRARY_APPLICATION_UPDATE = 'libraryApplicationUpdate',
  LOBBY_CREATE = 'lobbyCreate',
  LOBBY_DELETE = 'lobbyDelete',
  LOBBY_UPDATE = 'lobbyUpdate',
  LOBBY_MEMBER_CONNECT = 'lobbyMemberConnect',
  LOBBY_MEMBER_DISCONNECT = 'lobbyMemberDisconnect',
  LOBBY_MEMBER_UPDATE = 'lobbyMemberUpdate',
  LOBBY_MESSAGE = 'lobbyMessage',
  LOBBY_VOICE_SERVER_UPDATE = 'lobbyVoiceServerUpdate',
  LOBBY_VOICE_STATE_UPDATE = 'lobbyVoiceStateUpdate',
  MESSAGE_ACK = 'messageAck',
  MESSAGE_CREATE = 'messageCreate',
  MESSAGE_DELETE = 'messageDelete',
  MESSAGE_DELETE_BULK = 'messageDeleteBulk',
  MESSAGE_REACTION_ADD = 'messageReactionAdd',
  MESSAGE_REACTION_REMOVE = 'messageReactionRemove',
  MESSAGE_REACTION_REMOVE_ALL = 'messageReactionRemoveAll',
  MESSAGE_REACTION_REMOVE_EMOJI = 'messageReactionRemoveEmoji',
  MESSAGE_UPDATE = 'messageUpdate',
  OAUTH2_TOKEN_REMOVE = 'oauth2TokenRemove',
  PRESENCES_REPLACE = 'presencesReplace',
  PRESENCE_UPDATE = 'presenceUpdate',
  RECENT_MENTION_DELETE = 'recentMentionDelete',
  RELATIONSHIP_ADD = 'relationshipAdd',
  RELATIONSHIP_REMOVE = 'relationshipRemove',
  SESSIONS_REPLACE = 'sessionsReplace',
  STAGE_INSTANCE_CREATE = 'stageInstanceCreate',
  STAGE_INSTANCE_DELETE = 'stageInstanceDelete',
  STAGE_INSTANCE_UPDATE = 'stageInstanceUpdate',
  STREAM_CREATE = 'streamCreate',
  STREAM_DELETE = 'streamDelete',
  STREAM_SERVER_UPDATE = 'streamServerUpdate',
  STREAM_UPDATE = 'streamUpdate',
  THREAD_CREATE = 'threadCreate',
  THREAD_DELETE = 'threadDelete',
  THREAD_LIST_SYNC = 'threadListSync',
  THREAD_MEMBER_UPDATE = 'threadMemberUpdate',
  THREAD_MEMBERS_UPDATE = 'threadMembersUpdate',
  THREAD_UPDATE = 'threadUpdate',
  TYPING_START = 'typingStart',
  TYPING_STOP = 'typingStop',
  USER_ACHIEVEMENT_UPDATE = 'userAchievementUpdate',
  USER_CONNECTIONS_UPDATE = 'userConnectionsUpdate',
  USER_FEED_SETTINGS_UPDATE = 'userFeedSettingsUpdate',
  USER_GUILD_SETTINGS_UPDATE = 'userGuildSettingsUpdate',
  USER_NOTE_UPDATE = 'userNoteUpdate',
  USER_PAYMENT_SOURCES_UPDATE = 'userPaymentSourcesUpdate',
  USER_PAYMENTS_UPDATE = 'userPaymentsUpdate',
  USER_REQUIRED_ACTION_UPDATE = 'userRequiredActionUpdate',
  USER_SETTINGS_UPDATE = 'userSettingsUpdate',
  USER_SUBSCRIPTIONS_UPDATE = 'userSubscriptionsUpdate',
  USER_UPDATE = 'userUpdate',
  USERS_UPDATE = 'usersUpdate',
  VOICE_SERVER_UPDATE = 'voiceServerUpdate',
  VOICE_STATE_UPDATE = 'voiceStateUpdate',
  WEBHOOKS_UPDATE = 'webhooksUpdate',
  CLUSTER_PROCESS = 'clusterProcess',
  COMMAND_DELETE = 'commandDelete',
  COMMAND_ERROR = 'commandError',
  COMMAND_FAIL = 'commandFail',
  COMMAND_NONE = 'commandNone',
  COMMAND_PERMISSIONS_FAIL = 'commandPermissionsFail',
  COMMAND_PERMISSIONS_FAIL_CLIENT = 'commandPermissionsFailClient',
  COMMAND_RAN = 'commandRan',
  COMMAND_RATELIMIT = 'commandRatelimit',
  COMMAND_RESPONSE_DELETE = 'commandResponseDelete',
  COMMAND_RUN_ERROR = 'commandRunError',
  GATEWAY_READY = 'gatewayReady',
  GATEWAY_RESUMED = 'gatewayResumed',
  KILLED = 'killed',
  RAW = 'raw',
  READY = 'ready',
  REST_REQUEST = 'restRequest',
  REST_RESPONSE = 'restResponse',
  SHARD = 'shard',
  UNKNOWN = 'unknown',
  WARN = 'warn',
}


export enum ClusterIPCOpCodes {
  READY = 0,
  CLOSE = 1,
  SHARD_STATE = 2,
  RESPAWN_ALL = 3,
  EVAL = 4,
  IDENTIFY_REQUEST = 5,
  REST_REQUEST = 6,
  FILL_INTERACTION_COMMANDS = 7,
}


export enum Colors {
  BLURPLE = 7506394,
}


export enum CommandArgumentTypes {
  BOOL = 'bool',
  FLOAT = 'float',
  NUMBER = 'number',
  STRING = 'string',
}


export const CommandErrors = Object.freeze({

});


export enum CommandRatelimitTypes {
  CHANNEL = 'channel',
  GUILD = 'guild',
  USER = 'user',
}


export enum DiscordOpusFormat {
  CHANNELS = 2,
  SAMPLE_RATE = 48000,
}


export enum DiscordRegexNames {
  EMOJI = 'EMOJI',
  JUMP_CHANNEL = 'JUMP_CHANNEL',
  JUMP_CHANNEL_MESSAGE = 'JUMP_CHANNEL_MESSAGE',
  MENTION_CHANNEL = 'MENTION_CHANNEL',
  MENTION_ROLE = 'MENTION_ROLE',
  MENTION_USER = 'MENTION_USER',
  TEXT_BOLD = 'TEXT_BOLD',
  TEXT_CODEBLOCK = 'TEXT_CODEBLOCK',
  TEXT_CODESTRING = 'TEXT_CODESTRING',
  TEXT_ITALICS = 'TEXT_ITALICS',
  TEXT_SNOWFLAKE = 'TEXT_SNOWFLAKE',
  TEXT_SPOILER = 'TEXT_SPOILER',
  TEXT_STRIKE = 'TEXT_STRIKE',
  TEXT_UNDERLINE = 'TEXT_UNDERLINE',
  TEXT_URL = 'TEXT_URL',
}


export const DiscordRegex = Object.freeze({
  [DiscordRegexNames.EMOJI]: /<a?:(\w+):(\d+)>/g,
  [DiscordRegexNames.JUMP_CHANNEL]: /^(?:https?):\/\/(?:(?:(?:canary|ptb)\.)?(?:discord|discordapp)\.com\/channels\/)(\@me|\d+)\/(\d+)$/g,
  [DiscordRegexNames.JUMP_CHANNEL_MESSAGE]: /^(?:https?):\/\/(?:(?:(?:canary|ptb)\.)?(?:discord|discordapp)\.com\/channels\/)(\@me|\d+)\/(\d+)\/(\d+)$/g,
  [DiscordRegexNames.MENTION_CHANNEL]: /<#(\d+)>/g,
  [DiscordRegexNames.MENTION_ROLE]: /<@&(\d+)>/g,
  [DiscordRegexNames.MENTION_USER]: /<@(!?)(\d+)>/g,
  [DiscordRegexNames.TEXT_BOLD]: /\*\*([\s\S]+?)\*\*/g,
  [DiscordRegexNames.TEXT_CODEBLOCK]: /```(([a-z0-9-]+?)\n+)?\n*([^]+?)\n*```/gi,
  [DiscordRegexNames.TEXT_CODESTRING]: /`([\s\S]+?)`/g,
  [DiscordRegexNames.TEXT_ITALICS]: /_([\s\S]+?)_|\*([\s\S]+?)\*/g,
  [DiscordRegexNames.TEXT_SNOWFLAKE]: /(\d+)/g,
  [DiscordRegexNames.TEXT_SPOILER]: /\|\|([\s\S]+?)\|\|/g,
  [DiscordRegexNames.TEXT_STRIKE]: /~~([\s\S]+?)~~(?!_)/g,
  [DiscordRegexNames.TEXT_UNDERLINE]: /__([\s\S]+?)__/g,
  [DiscordRegexNames.TEXT_URL]: /((?:https?):\/\/[^\s<]+[^<.,:;"'\]\s])/g,
});


export enum Distributors {
  BATTLENET = 'battlenet',
  DISCORD = 'discord',
  EPIC = 'epic',
  GOG = 'gog',
  ORIGIN = 'origin',
  STEAM = 'steam',
  TWITCH = 'twitch',
  UPLAY = 'uplay',
}

export const DistributorNames: {[key in Distributors]: string} = Object.freeze({
  [Distributors.BATTLENET]: 'Battle.net',
  [Distributors.DISCORD]: 'Discord',
  [Distributors.EPIC]: 'Epic',
  [Distributors.GOG]: 'GOG',
  [Distributors.ORIGIN]: 'Origin',
  [Distributors.STEAM]: 'Steam',
  [Distributors.TWITCH]: 'Twitch',
  [Distributors.UPLAY]: 'Uplay',
});

// twitch shut down
export const DistributorUrls = Tools.URIEncodeWrap({
  [Distributors.BATTLENET]: (skuId: string) =>
    `https://shop.battle.net/family/${skuId}`,
  [Distributors.DISCORD]: (skuId: string, slug?: null | string) =>
    Endpoints.Routes.URL + `/store/skus/${skuId}` + ((slug) ? `/${slug}` : ''),
  [Distributors.EPIC]: (skuId: string) =>
    `https://epicgames.com/store/product/${skuId}`,
  [Distributors.GOG]: (skuId: string) =>
    `https://gog.com/game/${skuId}`,
  [Distributors.ORIGIN]: (skuId: string) =>
    `https://origin.com/search?searchString=${skuId}`,
  [Distributors.STEAM]: (skuId: string) =>
    `https://store.steampowered.com/app/${skuId}`,
  [Distributors.UPLAY]: (skuId: string) =>
    `https://store.ubi.com/search/?q=${skuId}`,
});


export enum EntitlementTypes {
  PURCHASE = 1,
  PREMIUM_SUBSCRIPTION = 2,
  DEVELOPER_GIFT = 3,
  TEST_MODE_PURCHASE = 4,
  FREE_PURCHASE = 5,
  USER_GIFT = 6,
}


export enum ExplicitContentFilterTypes {
  DISABLED = 0,
  NON_FRIENDS = 1,
  FRIENDS_AND_NON_FRIENDS = 2,
}


export enum GuildExplicitContentFilterTypes {
  DISABLED = 0,
  MEMBERS_WITHOUT_ROLES = 1,
  ALL_MEMBERS = 2,
}


export const GuildFeatures = Tools.normalize({
  ANIMATED_ICON: null,
  BANNER: null,
  COMMERCE: null,
  DISCOVERABLE: null,
  ENABLED_DISCOVERABLE_BEFORE: null,
  FEATURABLE: null,
  HUB: null,
  INVITE_SPLASH: null,
  LURKABLE: null,
  MEMBER_VERIFICATION_GATE_ENABLED: null,
  MEMBER_LIST_DISABLED: null,
  MONETIZATION_ENABLED: null,
  MORE_EMOJI: null,
  MORE_STICKERS: null,
  NEWS: null,
  NEW_THREAD_PERMISSIONS: null,
  PARTNERED: null,
  PREVIEW_ENABLED: null,
  PRIVATE_THREADS: null,
  PUBLIC: null,
  PUBLIC_DISABLED: null,
  ROLE_ICONS: null,
  SEVEN_DAY_THREAD_ARCHIVE: null,
  THREADS_ENABLED: null,
  THREADS_ENABLED_TESTING: null,
  THREE_DAY_THREAD_ARCHIVE: null,
  TICKETED_EVENTS_ENABLED: null,
  VANITY_URL: null,
  VERIFIED: null,
  VIP_REGIONS: null,
  WELCOME_SCREEN_ENABLED: null,
});


export enum GuildNotificationSettings {
  ALL = 0,
  MENTIONS = 1,
}


export enum GuildNSFWLevels {
  DEFAULT = 0,
  EXPLICIT = 1,
  SAFE = 2,
  AGE_RESTRICTED = 3,
}


export enum GuildWidgetStyles {
  BANNER_1 = 'banner1',
  BANNER_2 = 'banner2',
  BANNER_3 = 'banner3',
  BANNER_4 = 'banner4',
  SHIELD = 'shield',
}


export enum ImageFormats {
  GIF = 'gif',
  JPEG = 'jpeg',
  JPG = 'jpg',
  PNG = 'png',
  WEBP = 'webp',
}


export enum InteractionCallbackTypes {
  PONG = 1,

  CHANNEL_MESSAGE_WITH_SOURCE = 4,
  DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE = 5,
  DEFERRED_UPDATE_MESSAGE = 6,
  UPDATE_MESSAGE = 7,
  APPLICATION_COMMAND_AUTOCOMPLETE_RESULT = 8,
}


export enum InteractionTypes {
  PING = 1,
  APPLICATION_COMMAND = 2,
  MESSAGE_COMPONENT = 3,
  APPLICATION_COMMAND_AUTOCOMPLETE = 4,
}


export enum InviteTargetTypes {
  STREAM = 1,
  EMBEDDED_APPLICATION = 2,
}


export enum LibraryApplicationFlags {
  HIDDEN = 1 << 0,
  PRIVATE = 1 << 1,
  OVERLAY_DISABLED = 1 << 2,
  ENTITLED = 1 << 3,
  PREMIUM = 1 << 4,
}


export enum LobbyErrors {
  NO_ERROR = 0,
  UNKNOWN_ERROR = 1,
  SERVICE_UNAVAILABLE = 2,
  NOT_FOUND = 3,
  INVALID_SECRET = 4,
  FULL = 5,
  LOBBY_LIMIT_REACHED = 6,
  ALREADY_CONNECTING = 7,
}


export enum LobbyTypes {
  PRIVATE = 1,
  PUBLIC = 2,
}


export enum Locales {
  BULGARIAN = 'bg',
  CHINESE = 'zh-CN',
  CHINESE_TAIWAN = 'zh-TW',
  CROATIAN = 'hr',
  CZECH = 'cs',
  DANISH = 'da',
  DUTCH = 'nl',
  ENGLISH_GB = 'en-GB',
  ENGLISH_US = 'en-US',
  FINNISH = 'fi',
  FRENCH = 'fr',
  GERMAN = 'de',
  GREEK = 'el',
  HUNGARIAN = 'hu',
  ITALIAN = 'it',
  JAPANESE = 'ja',
  KOREAN = 'ko',
  LITHUANIAN = 'lt',
  NORWEGIAN = 'no',
  POLISH = 'pl',
  PORTUGUESE_BRAZILIAN = 'pt-BR',
  ROMANIAN = 'ro',
  RUSSIAN = 'ru',
  SPANISH = 'es-ES',
  SWEDISH = 'sv-SE',
  THAI = 'th',
  TURKISH = 'tr',
  UKRAINIAN = 'uk',
  VIETNAMESE = 'vi',
}

export const LocalesText = Object.freeze({
  [Locales.BULGARIAN]: 'Bulgarian',
  [Locales.CHINESE]: 'Chinese, China',
  [Locales.CHINESE_TAIWAN]: 'Chinese, Taiwan',
  [Locales.CROATIAN]: 'Croatian',
  [Locales.CZECH]: 'Czech',
  [Locales.DANISH]: 'Danish',
  [Locales.DUTCH]: 'Dutch',
  [Locales.ENGLISH_GB]: 'English, UK',
  [Locales.ENGLISH_US]: 'English, US',
  [Locales.FINNISH]: 'Finnish',
  [Locales.FRENCH]: 'French',
  [Locales.GERMAN]: 'German',
  [Locales.GREEK]: 'Greek',
  [Locales.HUNGARIAN]: 'Hungarian',
  [Locales.ITALIAN]: 'Italian',
  [Locales.JAPANESE]: 'Japanese',
  [Locales.KOREAN]: 'Korean',
  [Locales.LITHUANIAN]: 'Lithuanian',
  [Locales.NORWEGIAN]: 'Norwegian',
  [Locales.POLISH]: 'Polish',
  [Locales.PORTUGUESE_BRAZILIAN]: 'Portuguese, Brazilian',
  [Locales.ROMANIAN]: 'Romanian',
  [Locales.RUSSIAN]: 'Russian',
  [Locales.SPANISH]: 'Spanish',
  [Locales.SWEDISH]: 'Swedish',
  [Locales.THAI]: 'Thai',
  [Locales.TURKISH]: 'Turkish',
  [Locales.UKRAINIAN]: 'Ukrainian',
  [Locales.VIETNAMESE]: 'Vietnamese',
});


export enum MarkupTimestampStyles {
  BOTH_LONG = 'F',
  BOTH_SHORT = 'f',
  DATE_LONG = 'D',
  DATE_SHORT = 'd',
  RELATIVE = 'R',
  TIME_LONG = 'T',
  TIME_SHORT = 't',
}


export enum MessageComponentButtonStyles {
  PRIMARY = 1,
  SECONDARY = 2,
  SUCCESS = 3,
  DANGER = 4,
  LINK = 5,
}


export enum MessageComponentTypes {
  ACTION_ROW = 1,
  BUTTON = 2,
  SELECT_MENU = 3,
}


export enum MessageEmbedTypes {
  APPLICATION_NEWS = 'application_news',
  ARTICLE = 'article',
  GIFV = 'gifv',
  IMAGE = 'image',
  LINK = 'link',
  RICH = 'rich',
  TWEET = 'tweet',
  VIDEO = 'video',
}


export enum MessageFlags {
  CROSSPOSTED = 1 << 0,
  IS_CROSSPOST = 1 << 1,
  SUPPRESS_EMBEDS = 1 << 2,
  SOURCE_MESSAGE_DELETED = 1 << 3,
  URGENT = 1 << 4,
  HAS_THREAD = 1 << 5,
  EPHEMERAL = 1 << 6,
  LOADING = 1 << 7,
}


export enum MessageTypes {
  BASE = -1,
  DEFAULT = 0,
  RECIPIENT_ADD = 1,
  RECIPIENT_REMOVE = 2,
  CALL = 3,
  CHANNEL_NAME_CHANGE = 4,
  CHANNEL_ICON_CHANGE = 5,
  CHANNEL_PINNED_MESSAGE = 6,
  GUILD_MEMBER_JOIN = 7,
  GUILD_PREMIUM_SUBSCRIPTION = 8,
  GUILD_PREMIUM_SUBSCRIPTION_TIER_1 = 9,
  GUILD_PREMIUM_SUBSCRIPTION_TIER_2 = 10,
  GUILD_PREMIUM_SUBSCRIPTION_TIER_3 = 11,
  CHANNEL_FOLLOW_ADD = 12,
  GUILD_STREAM = 13,
  GUILD_DISCOVERY_DISQUALIFIED = 14,
  GUILD_DISCOVERY_REQUALIFIED = 15,
  GUILD_DISCOVERY_GRACE_PERIOD_INITIAL_WARNING = 16,
  GUILD_DISCOVERY_GRACE_PERIOD_FINAL_WARNING = 17,
  THREAD_CREATED = 18,
  REPLY = 19,
  CHAT_INPUT_COMMAND = 20,
  THREAD_STARTER_MESSAGE = 21,
  GUILD_INVITE_REMINDER = 22,
  CONTEXT_MENU_COMMAND = 23,
}

export const MessageTypesDeletable = Object.freeze({
  [MessageTypes.BASE]: true,
  [MessageTypes.DEFAULT]: true,
  [MessageTypes.RECIPIENT_ADD]: false,
  [MessageTypes.RECIPIENT_REMOVE]: false,
  [MessageTypes.CALL]: false,
  [MessageTypes.CHANNEL_NAME_CHANGE]: false,
  [MessageTypes.CHANNEL_ICON_CHANGE]: false,
  [MessageTypes.CHANNEL_PINNED_MESSAGE]: true,
  [MessageTypes.GUILD_MEMBER_JOIN]: true,
  [MessageTypes.GUILD_PREMIUM_SUBSCRIPTION]: true,
  [MessageTypes.GUILD_PREMIUM_SUBSCRIPTION_TIER_1]: true,
  [MessageTypes.GUILD_PREMIUM_SUBSCRIPTION_TIER_2]: true,
  [MessageTypes.GUILD_PREMIUM_SUBSCRIPTION_TIER_3]: true,
  [MessageTypes.CHANNEL_FOLLOW_ADD]: true,
  [MessageTypes.GUILD_STREAM]: false,
  [MessageTypes.GUILD_DISCOVERY_DISQUALIFIED]: false,
  [MessageTypes.GUILD_DISCOVERY_REQUALIFIED]: false,
  [MessageTypes.GUILD_DISCOVERY_GRACE_PERIOD_INITIAL_WARNING]: false,
  [MessageTypes.GUILD_DISCOVERY_GRACE_PERIOD_FINAL_WARNING]: false,
  [MessageTypes.THREAD_CREATED]: false,
  [MessageTypes.REPLY]: true,
  [MessageTypes.CHAT_INPUT_COMMAND]: true,
  [MessageTypes.THREAD_STARTER_MESSAGE]: false,
  [MessageTypes.GUILD_INVITE_REMINDER]: true,
  [MessageTypes.CONTEXT_MENU_COMMAND]: true,
});


export enum MfaLevels {
  NONE = 0,
  ELEVATED = 1,
}


export enum Oauth2AssetTypes {
  SMALL = 1,
  LARGE = 2,
}


export enum Oauth2Scopes {
  ACTIVITIES_READ = 'activities.read',
  ACTIVITIES_WRITE = 'activities.write',
  APPLICATIONS_BUILDS_UPLOAD = 'applications.builds.upload',
  APPLICATIONS_BUILDS_READ = 'applications.builds.read',
  APPLICATIONS_ENTITLEMENTS = 'applications.entitlements',
  APPLICATIONS_STORE_UPDATE = 'applications.store.update',
  BOT = 'bot',
  CONNECTIONS = 'connections',
  EMAIL = 'email',
  GDM_JOIN = 'gdm.join',
  GUILDS = 'guilds',
  GUILDS_JOIN = 'guilds.join',
  IDENTIFY = 'identify',
  MESSAGES_READ = 'messages.read',
  RELATIONSHIPS_READ = 'relationships.read',
  RPC = 'rpc',
  RPC_API = 'rpc.api',
  RPC_NOTIFICATIONS_READ = 'rpc.notifications.read',
  WEBHOOK_INCOMING = 'webhook.incoming',
}


export enum OverwriteTypes {
  ROLE = 0,
  MEMBER = 1,
}


export const Permissions = Object.freeze({
  NONE: 0n,
  CREATE_INSTANT_INVITE: 1n << 0n,
  KICK_MEMBERS: 1n << 1n,
  BAN_MEMBERS: 1n << 2n,
  ADMINISTRATOR: 1n << 3n,
  MANAGE_CHANNELS: 1n << 4n,
  MANAGE_GUILD: 1n << 5n,
  ADD_REACTIONS: 1n << 6n,
  VIEW_AUDIT_LOG: 1n << 7n,
  PRIORITY_SPEAKER: 1n << 8n,
  STREAM: 1n << 9n,
  VIEW_CHANNEL: 1n << 10n,
  SEND_MESSAGES: 1n << 11n,
  SEND_TTS_MESSAGES: 1n << 12n,
  MANAGE_MESSAGES: 1n << 13n,
  EMBED_LINKS: 1n << 14n,
  ATTACH_FILES: 1n << 15n,
  READ_MESSAGE_HISTORY: 1n << 16n,
  MENTION_EVERYONE: 1n << 17n,
  USE_EXTERNAL_EMOJIS: 1n << 18n,
  VIEW_GUILD_ANALYTICS: 1n << 19n,
  CONNECT: 1n << 20n,
  SPEAK: 1n << 21n,
  MUTE_MEMBERS: 1n << 22n,
  DEAFEN_MEMBERS: 1n << 23n,
  MOVE_MEMBERS: 1n << 24n,
  USE_VAD: 1n << 25n,
  CHANGE_NICKNAME: 1n << 26n,
  CHANGE_NICKNAMES: 1n << 27n,
  MANAGE_ROLES: 1n << 28n,
  MANAGE_WEBHOOKS: 1n << 29n,
  MANAGE_EMOJIS: 1n << 30n,
  USE_APPLICATION_COMMANDS: 1n << 31n,
  REQUEST_TO_SPEAK: 1n << 32n,
  MANAGE_EVENTS: 1n << 33n,
  MANAGE_THREADS: 1n << 34n,
  USE_PUBLIC_THREADS: 1n << 35n,
  USE_PRIVATE_THREADS: 1n << 36n,
  USE_EXTERNAL_STICKERS: 1n << 37n,
  SEND_MESSAGES_IN_THREADS: 1n << 38n,
});

export const PERMISSIONS_ALL = Object.values(Permissions).reduce(
  (permissions: bigint, permission: bigint) => permissions | permission,
  Permissions.NONE,
);

export const PERMISSIONS_ALL_TEXT = [
  Permissions.ADD_REACTIONS,
  Permissions.SEND_MESSAGES,
  Permissions.SEND_TTS_MESSAGES,
  Permissions.MANAGE_MESSAGES,
  Permissions.EMBED_LINKS,
  Permissions.ATTACH_FILES,
  Permissions.READ_MESSAGE_HISTORY,
  Permissions.MENTION_EVERYONE,
  Permissions.USE_EXTERNAL_EMOJIS,
  Permissions.USE_APPLICATION_COMMANDS,
  Permissions.MANAGE_THREADS,
  Permissions.USE_PUBLIC_THREADS,
  Permissions.USE_PRIVATE_THREADS,
].reduce(
  (permissions: bigint, permission: bigint) => permissions | permission,
  Permissions.NONE,
);

export const PERMISSIONS_ALL_VOICE = [
  Permissions.PRIORITY_SPEAKER,
  Permissions.STREAM,
  Permissions.CONNECT,
  Permissions.SPEAK,
  Permissions.MUTE_MEMBERS,
  Permissions.DEAFEN_MEMBERS,
  Permissions.MOVE_MEMBERS,
  Permissions.USE_VAD,
  Permissions.REQUEST_TO_SPEAK,
].reduce(
  (permissions: bigint, permission: bigint) => permissions | permission,
  Permissions.NONE,
);

export const PERMISSIONS_DEFAULT = [
  Permissions.CREATE_INSTANT_INVITE,
  Permissions.CHANGE_NICKNAME,
  Permissions.VIEW_CHANNEL,

  Permissions.ADD_REACTIONS,
  Permissions.SEND_MESSAGES,
  Permissions.SEND_TTS_MESSAGES,
  Permissions.EMBED_LINKS,
  Permissions.ATTACH_FILES,
  Permissions.READ_MESSAGE_HISTORY,
  Permissions.MENTION_EVERYONE,
  Permissions.USE_EXTERNAL_EMOJIS,

  Permissions.STREAM,
  Permissions.CONNECT,
  Permissions.SPEAK,
  Permissions.USE_VAD,
].reduce(
  (permissions: bigint, permission: bigint) => permissions | permission,
  Permissions.NONE,
);

export const PERMISSIONS_LURKER = [
  Permissions.VIEW_CHANNEL,
  Permissions.READ_MESSAGE_HISTORY,
].reduce(
  (permissions: bigint, permission: bigint) => permissions | permission,
  Permissions.NONE,
);

export const PERMISSIONS_FOR_GUILD = [
  Permissions.ADMINISTRATOR,
].reduce(
  (permissions: bigint, permission: bigint) => permissions | permission,
  Permissions.NONE,
);

export const PERMISSIONS_FOR_CHANNEL_TEXT = [
  Permissions.ADMINISTRATOR,
].reduce(
  (permissions: bigint, permission: bigint) => permissions | permission,
  Permissions.NONE,
);

export const PERMISSIONS_FOR_CHANNEL_VOICE = [
  Permissions.ADMINISTRATOR,
].reduce(
  (permissions: bigint, permission: bigint) => permissions | permission,
  Permissions.NONE,
);


export enum PlatformTypes {
  BATTLENET = 'battlenet',
  CONTACTS = 'contacts',
  FACEBOOK = 'facebook',
  GITHUB = 'github',
  INSTAGRAM = 'instagram',
  LEAGUE_OF_LEGENDS = 'leagueoflegends',
  REDDIT = 'reddit',
  SAMSUNG = 'samsung',
  SKYPE = 'skype',
  SOUNDCLOUD = 'soundcloud',
  SPOTIFY = 'spotify',
  STEAM = 'steam',
  TWITCH = 'twitch',
  TWITTER = 'twitter',
  YOUTUBE = 'youtube',
  XBOX = 'xbox',
}


export enum PremiumGuildTiers {
  NONE = 0,
  TIER_1 = 1,
  TIER_2 = 2,
  TIER_3 = 3,
}

export const PremiumGuildTierNames = Object.freeze({
  [PremiumGuildTiers.NONE]: 'No Level',
  [PremiumGuildTiers.TIER_1]: 'Level 1',
  [PremiumGuildTiers.TIER_2]: 'Level 2',
  [PremiumGuildTiers.TIER_3]: 'Level 3',
});

export const PremiumGuildSubscriptionsRequired = Object.freeze({
  [PremiumGuildTiers.NONE]: 0,
  [PremiumGuildTiers.TIER_1]: 2,
  [PremiumGuildTiers.TIER_2]: 15,
  [PremiumGuildTiers.TIER_3]: 30,
});

export const PremiumGuildLimits = Object.freeze({
  [PremiumGuildTiers.NONE]: Object.freeze({
    attachment: MAX_ATTACHMENT_SIZE,
    bitrate: MAX_BITRATE,
    emoji: MAX_EMOJI_SLOTS,
  }),
  [PremiumGuildTiers.TIER_1]: Object.freeze({
    attachment: MAX_ATTACHMENT_SIZE,
    bitrate: 128000,
    emoji: 100,
  }),
  [PremiumGuildTiers.TIER_2]: Object.freeze({
    attachment: MAX_ATTACHMENT_SIZE_PREMIUM,
    bitrate: 256000,
    emoji: 150,
  }),
  [PremiumGuildTiers.TIER_3]: Object.freeze({
    attachment: MAX_ATTACHMENT_SIZE_PREMIUM * 2,
    bitrate: 384000,
    emoji: 250,
  }),
});


export enum PremiumUserTypes {
  NONE = 0,
  TIER_1 = 1,
  TIER_2 = 2,
}

export const PremiumUserLimits = Object.freeze({
  [PremiumUserTypes.NONE]: Object.freeze({
    attachment: MAX_ATTACHMENT_SIZE,
  }),
  [PremiumUserTypes.TIER_1]: Object.freeze({
    attachment: MAX_ATTACHMENT_SIZE_PREMIUM,
  }),
  [PremiumUserTypes.TIER_2]: Object.freeze({
    attachment: MAX_ATTACHMENT_SIZE_PREMIUM * 2,
  }),
});


export enum RelationshipTypes {
  NONE = 0,
  FRIEND = 1,
  BLOCKED = 2,
  PENDING_INCOMING = 3,
  PENDING_OUTGOING = 4,
  IMPLICIT = 5,
}


export enum SkuAccessTypes {
  FULL = 1,
  EARLY_ACCESS = 2,
  VIP_ACCESS = 3,
}


export enum SkuFlags {
  PREMIUM_PURCHASE = 1 << 0,
  HAS_FREE_PREMIUM_CONTENT = 1 << 1,
  AVAILABLE = 1 << 2,
  PREMIUM_AND_DISTRIBUTION = 1 << 3,
  STICKER_PACK = 1 << 4,
}


export enum SkuTypes {
  BASE = 0,
  GAME = 1,
  DLC = 2,
  CONSUMABLE = 3,
  BUNDLE = 4,
  SUBSCRIPTION = 5,
}


export const SpecialUrls = Tools.URIEncodeWrap({
  SPOTIFY_TRACK: (trackId: string): string =>
    `https://open.spotify.com/track/${trackId}`,
  YOUTUBE_VIDEO: (videoId: string): string =>
    `https://youtu.be/${videoId}`,
  YOUTUBE_VIDEO_EMBED: (videoId: string): string =>
    `https://www.youtube.com/embed/${videoId}`,
  YOUTUBE_VIDEO_THUMBNAIL: (videoId: string): string =>
    `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
});


export enum StagePrivacyLevels {
  PUBLIC = 1,
  GUILD_ONLY = 2,
}


export enum StickerFormats {
  UNKNOWN = 0,
  PNG = 1,
  APNG = 2,
  LOTTIE = 3,
}


export enum StickerExtensions {
  PNG = 'png',
  APNG = 'png',
  LOTTIE = 'json',
}


export enum SystemChannelFlags {
  SUPPRESS_JOIN_NOTIFICATIONS = 1 << 0,
  SUPPRESS_PREMIUM_SUBSCRIPTIONS = 1 << 1,
}


export const SystemMessages = Object.freeze({
  CallMissed: 'You missed a call from :user:.',
  CallMissedWithDuration: 'You missed a call from :user: that lasted :duration:.',
  CallStarted: ':user: started a call.',
  CallStartedWithDuration: ':user: started a call that lasted :duration:.',
  ChannelFollowAdd: ':user: has added **:webhookName:** to this channel.',
  ChannelIconChange: ':user: changed the channel name: **:name:**',
  ChannelNameChange: ':user: changed the channel icon.',
  ChatInputCommandUsed: ':user: used /:command:.',
  ContextMenuCommandUsed: ':user: used /:command:.',
  GuildDiscoveryDisqualified: 'This server has been removed from Server Discovery because it no longer passes all the requirements. Check Server Settings for more details.',
  GuildDiscoveryGracePeriodFinalWarning: 'This server has failed Discovery activity requirements for 3 weeks in a row. If this server fails for 1 more week, it will be removed from Discovery.',
  GuildDiscoveryGracePeriodInitialWarning: 'This server has failed Discovery activity requirements for 1 week. If this server fails for 4 weeks in a row, it will be automatically removed from Discovery.',
  GuildDiscoveryRequalified: 'This server is eligible for Server Discovery again and has been automatically relisted!',
  PinnedMessage: ':user: pinned a message to this channel.',
  RecipientAdd: ':user: added :user2: to the group.',
  RecipientRemove: ':user: removed :user2: from the group.',
  RecipientRemoveSelf: ':user: left the group.',
  GuildMemberJoin: [
    ":user: joined the party.",
    ":user: is here.",
    "Welcome, :user:. We hope you brought pizza.",
    "A wild :user: appeared.",
    ":user: just landed.",
    ":user: just slid into the server.",
    ":user: just showed up!",
    "Welcome :user:. Say hi!",
    ":user: hopped into the server.",
    "Everyone welcome :user:!",
    "Glad you're here, :user:.",
    "Good to see you, :user:.",
    "Yay you made it, :user:!",
  ],
  GuildMemberSubscribed: ':user: just boosted the server!',
  GuildMemberSubscribedAchievedTier: ':user: just boosted the server! :guild: has achieved **:premiumTier:!**',
});


export enum TeamMembershipStates {
  BASE = 0,
  INVITED = 1,
  ACCEPTED = 2,
}


export enum TeamPayoutAccountStatuses {
  UNSUBMITTED = -1,
  PENDING = 2,
  ACTION_REQUIRED = 3,
  ACTIVE = 4,
  BLOCKED = 5,
  SUSPENDED = 6,
}


export enum UserFlags {
  STAFF = 1 << 0,
  PARTNER = 1 << 1,
  HYPESQUAD = 1 << 2,
  BUG_HUNTER_LEVEL_1 = 1 << 3,
  MFA_SMS = 1 << 4,
  PREMIUM_PROMO_DISMISSED = 1 << 5,
  HYPESQUAD_ONLINE_HOUSE_1 = 1 << 6,
  HYPESQUAD_ONLINE_HOUSE_2 = 1 << 7,
  HYPESQUAD_ONLINE_HOUSE_3 = 1 << 8,
  PREMIUM_EARLY_SUPPORTER = 1 << 9,
  TEAM_USER = 1 << 10,
  SYSTEM = 1 << 12,
  HAS_UNREAD_URGENT_MESSAGES = 1 << 13,
  BUG_HUNTER_LEVEL_2 = 1 << 14,
  VERIFIED_BOT = 1 << 16,
  VERIFIED_DEVELOPER = 1 << 17,
  DISCORD_CERTIFIED_MODERATOR = 1 << 18,
}

// the level of their boost badge
export enum UserPremiumGuildSubscriptionLevels {
  LEVEL_1 = 1,
  LEVEL_2 = 2,
  LEVEL_3 = 3,
  LEVEL_4 = 4,
  LEVEL_5 = 5,
  LEVEL_6 = 6,
  LEVEL_7 = 7,
  LEVEL_8 = 8,
  LEVEL_9 = 9,
}

export const UserPremiumGuildSubscriptionMonths = Object.freeze({
  [UserPremiumGuildSubscriptionLevels.LEVEL_2]: 2,
  [UserPremiumGuildSubscriptionLevels.LEVEL_3]: 3,
  [UserPremiumGuildSubscriptionLevels.LEVEL_4]: 6,
  [UserPremiumGuildSubscriptionLevels.LEVEL_5]: 9,
  [UserPremiumGuildSubscriptionLevels.LEVEL_6]: 12,
  [UserPremiumGuildSubscriptionLevels.LEVEL_7]: 15,
  [UserPremiumGuildSubscriptionLevels.LEVEL_8]: 18,
  [UserPremiumGuildSubscriptionLevels.LEVEL_9]: 24,
});

export const UserRequiredActions = Tools.normalize({
  AGREEMENTS: null,
  REQUIRE_CAPTCHA: null,
  REQUIRE_VERIFIED_EMAIL: null,
  REQUIRE_VERIFIED_PHONE: null,
});

export enum VerificationLevels {
  NONE = 0,
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
  VERY_HIGH = 4,
}

export enum WebhookTypes {
  INCOMING = 1,
  CHANNEL_FOLLOWER = 2,
  APPLICATION = 3,
}

export const DiscordKeys = Object.freeze({
  ACCENT_COLOR: 'accent_color',
  ACCESS_TYPE: 'access_type',
  ACCOUNT: 'account',
  ACTION_TYPE: 'action_type',
  ACTIVE: 'active',
  ACTIVITIES: 'activities',
  ACTIVITY: 'activity',
  AFK_CHANNEL_ID: 'afk_channel_id',
  AFK_TIMEOUT: 'afk_timeout',
  ALIASES: 'aliases',
  ALLOW: 'allow',
  ALLOW_NEW: 'allow_new',
  ANALYTICS_TOKEN: 'analytics_token',
  ANIMATED: 'animated',
  APPLICATION: 'application',
  APPLICATION_COMMAND_COUNT: 'application_command_count',
  APPLICATION_ID: 'application_id',
  APPROXIMATE_MEMBER_COUNT: 'approximate_member_count',
  APPROXIMATE_PRESENCE_COUNT: 'approximate_presence_count',
  ARCHIVE_TIMESTAMP: 'archive_timestamp',
  ARCHIVED: 'archived',
  ARCHIVER_ID: 'archiver_id',
  ASSET: 'asset',
  ASSETS: 'assets',
  ATTACHMENTS: 'attachments',
  AUTHOR: 'author',
  AUTO_ARCHIVE_DURATION: 'auto_archive_duration',
  AUTOCOMPLETE: 'autocomplete',
  AVAILABLE: 'available',
  AVATAR: 'avatar',
  BANNER: 'banner',
  BANNER_COLOR: 'banner_color',
  BIO: 'bio',
  BITRATE: 'bitrate',
  BOT: 'bot',
  BOT_PUBLIC: 'bot_public',
  BOT_REQUIRE_CODE_GRANT: 'bot_require_code_grant',
  BOX_ART: 'box_art',
  BUTTONS: 'buttons',
  CALL: 'call',
  CAROUSEL_ITEMS: 'carousel_items',
  CATEGORY: 'category',
  CHANGES: 'changes',
  CHANNEL: 'channel',
  CHANNELS: 'channels',
  CHANNEL_ID: 'channel_id',
  CHOICES: 'choices',
  CLIENT: 'client',
  CLIENT_INFO: 'client_info',
  CLIENT_STATUS: 'client_status',
  CODE: 'code',
  COLOR: 'color',
  COMPONENT_TYPE: 'component_type',
  COMPONENTS: 'components',
  CONNECTED_ACCOUNTS: 'connected_accounts',
  CONTENT: 'content',
  CONTENT_RATING: 'content_rating',
  CONTENT_RATING_AGENCY: 'content_rating_agency',
  COUNT: 'count',
  COVER_IMAGE: 'cover_image',
  CREATED_AT: 'created_at',
  CREATOR: 'creator',
  CREATOR_ID: 'creator_id',
  CURRENCY: 'currency',
  CUSTOM: 'custom',
  CUSTOM_ID: 'custom_id',
  DATA: 'data',
  DEAF: 'deaf',
  DEFAULT: 'default',
  DEFAULT_MESSAGE_NOTIFICATIONS: 'default_message_notifications',
  DEFAULT_PERMISSION: 'default_permission',
  DELETE_MEMBER_DAYS: 'delete_member_days',
  DENY: 'deny',
  DENY_NEW: 'deny_new',
  DEPENDENT_SKU_ID: 'dependent_sku_id',
  DEPRECATED: 'deprecated',
  DESCRIPTION: 'description',
  DESKTOP: 'desktop',
  DETAILS: 'details',
  DEVELOPERS: 'developers',
  DISABLED: 'disabled',
  DISCOVERABLE_DISABLED: 'discoverable_disabled',
  DISCOVERY_SPLASH: 'discovery_splash',
  DISCRIMINATOR: 'discriminator',
  DISTRIBUTOR: 'distributor',
  EDITED_TIMESTAMP: 'edited_timestamp',
  EMAIL: 'email',
  EMBEDS: 'embeds',
  EMBED_CHANNEL_ID: 'embed_channel_id',
  EMBED_ENABLED: 'embed_enabled',
  EMOJI: 'emoji',
  EMOJIS: 'emojis',
  EMOJI_ID: 'emoji_id',
  EMOJI_NAME: 'emoji_name',
  ENABLED: 'enabled',
  END: 'end',
  ENDED: 'ended',
  ENDED_TIMESTAMP: 'ended_timestamp',
  ENTITLEMENT_BRANCH_ID: 'entitlement_branch_id',
  EPHEMERAL: 'ephemeral',
  EULA_ID: 'eula_id',
  EXECUTABLES: 'executables',
  EXPIRES_AT: 'expires_at',
  EXPIRE_BEHAVIOR: 'expire_behavior',
  EXPIRE_GRACE_PERIOD: 'expire_grace_period',
  EXPLICIT_CONTENT_FILTER: 'explicit_content_filter',
  FEATURES: 'features',
  FIELDS: 'fields',
  FILENAME: 'filename',
  FLAGS: 'flags',
  FOCUSED: 'focused',
  FOOTER: 'footer',
  FORMAT_TYPE: 'format_type',
  FRIEND_SYNC: 'friend_sync',
  GAME: 'game',
  GAME_ID: 'game_id',
  GENRES: 'genres',
  GUILD: 'guild',
  GUILD_ID: 'guild_id',
  GUILD_IDS: 'guild_ids',
  GUILD_SCHEDULED_EVENT_ID: 'guild_scheduled_event_id',
  HEADER_BACKGROUND: 'header_background',
  HEADER_LOGO_DARK_THEME: 'header_logo_dark_theme',
  HEADER_LOGO_LIGHT_THEME: 'header_logo_light_theme',
  HEIGHT: 'height',
  HERO_BACKGROUND: 'hero_background',
  HERO_VIDEO: 'hero_video',
  HOIST: 'hoist',
  HOISTED_ROLE: 'hoisted_role',
  HOOK: 'hook',
  ICON: 'icon',
  ICON_URL: 'icon_url',
  ID: 'id',
  IDS: 'ids',
  IMAGE: 'image',
  INLINE: 'inline',
  INSTANCE: 'instance',
  INTEGRATIONS: 'integrations',
  INTERACTION: 'interaction',
  INTERVAL: 'interval',
  INTERVAL_COUNT: 'interval_count',
  INVITE_CODE: 'invite_code',
  INVITER: 'inviter',
  IS_DIRTY: 'is_dirty',
  IS_PARTIAL: 'is_partial',
  IS_PENDING: 'is_pending',
  JOIN: 'join',
  JOIN_TIMESTAMP: 'join_timestamp',
  JOINED_AT: 'joined_at',
  KEY: 'key',
  LABEL: 'label',
  LARGE: 'large',
  LARGE_IMAGE: 'large_image',
  LARGE_TEXT: 'large_text',
  LAST_MESSAGE_ID: 'last_message_id',
  LAST_MODIFIED: 'last_modified',
  LAST_PIN_TIMESTAMP: 'last_pin_timestamp',
  LAZY: 'lazy',
  LEGAL_NOTICE: 'legal_notice',
  LOCALE: 'locale',
  LOCALES: 'locales',
  LOCKED: 'locked',
  MANAGED: 'managed',
  MANIFEST_LABELS: 'manifest_labels',
  MATCH: 'match',
  MAX_AGE: 'max_age',
  MAX_MEMBERS: 'max_members',
  MAX_PRESENCES: 'max_presences',
  MAX_USES: 'max_uses',
  MAX_VALUES: 'max_values',
  MAX_VIDEO_CHANNEL_USERS: 'max_video_channel_users',
  ME: 'me',
  MEMBER: 'member',
  MEMBERS: 'members',
  MEMBERSHIP_STATE: 'membership_state',
  MEMBERS_REMOVED: 'members_removed',
  MEMBER_COUNT: 'member_count',
  MENTIONABLE: 'mentionable',
  MENTIONS: 'mentions',
  MENTION_CHANNELS: 'mention_channels',
  MENTION_EVERYONE: 'mention_everyone',
  MENTION_ROLES: 'mention_roles',
  MESSAGE: 'message',
  MESSAGES: 'messages',
  MESSAGE_COUNT: 'message_count',
  MESSAGE_ID: 'message_id',
  MESSAGE_REFERENCE: 'message_reference',
  METADATA: 'metadata',
  MFA_ENABLED: 'mfa_enabled',
  MFA_LEVEL: 'mfa_level',
  MIME_TYPE: 'mime_type',
  MIN_VALUES: 'min_values',
  MOBILE: 'mobile',
  MUTE: 'mute',
  MUTUAL_GUILDS: 'mutual_guilds',
  NAME: 'name',
  NEW_VALUE: 'new_value',
  NICK: 'nick',
  NICKS: 'nicks',
  NONCE: 'nonce',
  NSFW: 'nsfw',
  NSFW_LEVEL: 'nsfw_level',
  OLD_VALUE: 'old_value',
  OPTIMAL: 'optimal',
  OPTIONS: 'options',
  OS: 'os',
  OVERLAY: 'overlay',
  OVERLAY_COMPATIBILITY_HOOK: 'overlay_compatibility_hook',
  OWNER: 'owner',
  OWNER_ID: 'owner_id',
  OWNER_USER_ID: 'owner_user_id',
  PACK_ID: 'pack_id',
  PARENT_ID: 'parent_id',
  PARTICIPANTS: 'participants',
  PARTY: 'party',
  PARTY_ID: 'party_id',
  PAYOUT_ACCOUNT_STATUS: 'payout_account_status',
  PENDING: 'pending',
  PERMISSION: 'permission',
  PERMISSIONS: 'permissions',
  PERMISSIONS_NEW: 'permissions_new',
  PERMISSION_OVERWRITES: 'permission_overwrites',
  PHONE: 'phone',
  PINNED: 'pinned',
  PLACEHOLDER: 'placeholder',
  PLATFORM: 'platform',
  POSITION: 'position',
  PREFERRED_LOCALE: 'preferred_locale',
  PREMIUM: 'premium',
  PREMIUM_GUILD_SINCE: 'premium_guild_since',
  PREMIUM_SINCE: 'premium_since',
  PREMIUM_SUBSCRIPTION_COUNT: 'premium_subscription_count',
  PREMIUM_TIER: 'premium_tier',
  PREMIUM_TYPE: 'premium_type',
  PRESENCES: 'presences',
  PREVIEW_ASSET: 'preview_asset',
  PREVIEW_VIDEO: 'preview_video',
  PRICE: 'price',
  PRIMARY_SKU_ID: 'primary_sku_id',
  PRIVACY_LEVEL: 'privacyLevel',
  PROVIDER: 'provider',
  PROXY_ICON_URL: 'proxy_icon_url',
  PROXY_URL: 'proxy_url',
  PUBLIC_FLAGS: 'public_flags',
  PUBLIC_UPDATES_CHANNEL_ID: 'public_updates_channel_id',
  PUBLISHERS: 'publishers',
  RATE_LIMIT_PER_USER: 'rate_limit_per_user',
  REACTIONS: 'reactions',
  REASON: 'reason',
  RECIPIENTS: 'recipients',
  REDEEMED: 'redeemed',
  REDIRECT_URIS: 'redirect_uris',
  REFERENCE_ID: 'reference_id',
  REFERENCED_MESSAGE: 'referenced_message',
  REGION: 'region',
  RELEASE_DATE: 'release_date',
  REQUEST_TO_SPEAK_TIMESTAMP: 'request_to_speak_timestamp',
  REQUIRED: 'required',
  REQUIRE_COLONS: 'require_colons',
  RESOLVED: 'resolved',
  REVOKED: 'revoked',
  RINGING: 'ringing',
  ROLES: 'roles',
  ROLE_ID: 'role_id',
  RPC_APPLICATION_STATE: 'rpc_application_state',
  RPC_ORIGINS: 'rpc_origins',
  RTC_REGION: 'rtc_region',
  RULES_CHANNEL_ID: 'rules_channel_id',
  SECRET: 'secret',
  SECRETS: 'secrets',
  SELF_DEAF: 'self_deaf',
  SELF_MUTE: 'self_mute',
  SELF_STREAM: 'self_stream',
  SELF_VIDEO: 'self_video',
  SERIALIZED_SOURCE_GUILD: 'serialized_source_guild',
  SESSION_ID: 'session_id',
  SHOW_ACTIVITY: 'show_activity',
  SHOW_AGE_GATE: 'show_age_gate',
  SIZE: 'size',
  SKU: 'sku',
  SKU_ID: 'sku_id',
  SLUG: 'slug',
  SMALL_IMAGE: 'small_image',
  SMALL_TEXT: 'small_text',
  SORT_VALUE: 'sort_value',
  SOURCE_CHANNEL: 'source_channel',
  SOURCE_GUILD: 'source_guild',
  SOURCE_GUILD_ID: 'source_guild_id',
  SPECTATE: 'spectate',
  SPLASH: 'splash',
  STAGE_INSTANCES: 'stage_instances',
  START: 'start',
  STARTED: 'started',
  STATE: 'state',
  STATUS: 'status',
  STICKERS: 'stickers',
  STICKER_ITEMS: 'sticker_items',
  STOPPED: 'stopped',
  STORE_APPLICATION_STATE: 'store_application_state',
  STORE_LISTING: 'store_listing',
  STYLE: 'style',
  SUBSCRIPTION_PLAN: 'subscription_plan',
  SUBSCRIPTION_PLAN_ID: 'subscription_plan_id',
  SUBTARGET: 'subtarget',
  SUMMARY: 'summary',
  SUPPRESS: 'suppress',
  SYNCED_AT: 'synced_at',
  SYNCING: 'syncing',
  SYNC_ID: 'sync_id',
  SYSTEM: 'system',
  SYSTEM_CHANNEL_FLAGS: 'system_channel_flags',
  SYSTEM_CHANNEL_ID: 'system_channel_id',
  SYSTEM_REQUIREMENTS: 'system_requirements',
  TAGLINE: 'tagline',
  TAGS: 'tags',
  TARGET: 'target',
  TARGET_APPLICATION: 'target_application',
  TARGET_ID: 'target_id',
  TARGET_TYPE: 'target_type',
  TARGET_USER: 'target_user',
  TAX_INCLUSIVE: 'tax_inclusive',
  TEAM: 'team',
  TEAM_ID: 'team_id',
  TEMPORARY: 'temporary',
  TEXT: 'text',
  THIRD_PARTY_SKUS: 'third_party_skus',
  THREAD: 'thread',
  THREAD_METADATA: 'thread_metadata',
  THREADS: 'threads',
  THUMBNAIL: 'thumbnail',
  TIMEOUT: 'timeout',
  TIMESTAMP: 'timestamp',
  TIMESTAMPS: 'timestamps',
  TITLE: 'title',
  TOKEN: 'token',
  TOPIC: 'topic',
  TTS: 'tts',
  TYPE: 'type',
  UNAVAILABLE: 'unavailable',
  UNICODE_EMOJI: 'unicode_emoji',
  UPDATED_AT: 'updated_at',
  URL: 'url',
  USAGE_COUNT: 'usage_count',
  USER: 'user',
  USERNAME: 'username',
  USERS: 'users',
  USER_ID: 'user_id',
  USER_LIMIT: 'user_limit',
  USES: 'uses',
  VALUE: 'value',
  VALUES: 'values',
  VANITY_URL_CODE: 'vanity_url_code',
  VERIFICATION_LEVEL: 'verification_level',
  VERIFIED: 'verified',
  VERIFY_KEY: 'verify_key',
  VERSION: 'version',
  VIDEO: 'video',
  VIDEO_QUALITY_MODE: 'video_quality_mode',
  VIP: 'vip',
  VISIBILITY: 'visibility',
  VOICE_STATES: 'voice_states',
  WEB: 'web',
  WEBHOOK_ID: 'webhook_id',
  WELCOME_CHANNELS: 'welcome_channels',
  WELCOME_SCREEN: 'welcome_screen',
  WIDGET_CHANNEL_ID: 'widget_channel_id',
  WIDGET_ENABLED: 'widget_enabled',
  WIDTH: 'width',
  YOUTUBE_TRAILER_VIDEO_ID: 'youtube_trailer_video_id',
});

export const DetritusKeys = Object.freeze({
  [DiscordKeys.ACCENT_COLOR]: 'accentColor',
  [DiscordKeys.ACCESS_TYPE]: 'accessType',
  [DiscordKeys.ACCOUNT]: 'account',
  [DiscordKeys.ACTION_TYPE]: 'actionType',
  [DiscordKeys.ACTIVE]: 'active',
  [DiscordKeys.ACTIVITIES]: 'activities',
  [DiscordKeys.ACTIVITY]: 'activity',
  [DiscordKeys.AFK_CHANNEL_ID]: 'afkChannelId',
  [DiscordKeys.AFK_TIMEOUT]: 'afkTimeout',
  [DiscordKeys.ALIASES]: 'aliases',
  [DiscordKeys.ALLOW]: 'allow',
  [DiscordKeys.ALLOW_NEW]: 'allowNew',
  [DiscordKeys.ANALYTICS_TOKEN]: 'analyticsToken',
  [DiscordKeys.ANIMATED]: 'animated',
  [DiscordKeys.APPLICATION]: 'application',
  [DiscordKeys.APPLICATION_COMMAND_COUNT]: 'applicationCommandCount',
  [DiscordKeys.APPLICATION_ID]: 'applicationId',
  [DiscordKeys.APPROXIMATE_MEMBER_COUNT]: 'approximateMemberCount',
  [DiscordKeys.APPROXIMATE_PRESENCE_COUNT]: 'approximatePresenceCount',
  [DiscordKeys.ARCHIVE_TIMESTAMP]: 'archiveTimestamp',
  [DiscordKeys.ARCHIVED]: 'archived',
  [DiscordKeys.ARCHIVER_ID]: 'archiverId',
  [DiscordKeys.ASSET]: 'asset',
  [DiscordKeys.ASSETS]: 'assets',
  [DiscordKeys.ATTACHMENTS]: 'attachments',
  [DiscordKeys.AUTHOR]: 'author',
  [DiscordKeys.AUTO_ARCHIVE_DURATION]: 'autoArchiveDuration',
  [DiscordKeys.AUTOCOMPLETE]: 'autocomplete',
  [DiscordKeys.AVAILABLE]: 'available',
  [DiscordKeys.AVATAR]: 'avatar',
  [DiscordKeys.BANNER]: 'banner',
  [DiscordKeys.BANNER_COLOR]: 'bannerColor',
  [DiscordKeys.BIO]: 'bio',
  [DiscordKeys.BITRATE]: 'bitrate',
  [DiscordKeys.BOT]: 'bot',
  [DiscordKeys.BOT_PUBLIC]: 'botPublic',
  [DiscordKeys.BOT_REQUIRE_CODE_GRANT]: 'botRequireCodeGrant',
  [DiscordKeys.BOX_ART]: 'boxArt',
  [DiscordKeys.BUTTONS]: 'buttons',
  [DiscordKeys.CALL]: 'call',
  [DiscordKeys.CAROUSEL_ITEMS]: 'carouselItems',
  [DiscordKeys.CATEGORY]: 'category',
  [DiscordKeys.CHANGES]: 'changes',
  [DiscordKeys.CHANNEL]: 'channel',
  [DiscordKeys.CHANNELS]: 'channels',
  [DiscordKeys.CHANNEL_ID]: 'channelId',
  [DiscordKeys.CHOICES]: 'choices',
  [DiscordKeys.CLIENT]: 'client',
  [DiscordKeys.CLIENT_INFO]: 'clientInfo',
  [DiscordKeys.CLIENT_STATUS]: 'clientStatus',
  [DiscordKeys.CODE]: 'code',
  [DiscordKeys.COLOR]: 'color',
  [DiscordKeys.COMPONENT_TYPE]: 'componentType',
  [DiscordKeys.COMPONENTS]: 'components',
  [DiscordKeys.CONNECTED_ACCOUNTS]: 'connectedAccounts',
  [DiscordKeys.CONTENT]: 'content',
  [DiscordKeys.CONTENT_RATING]: 'contentRating',
  [DiscordKeys.CONTENT_RATING_AGENCY]: 'contentRatingAgency',
  [DiscordKeys.COUNT]: 'count',
  [DiscordKeys.COVER_IMAGE]: 'coverImage',
  [DiscordKeys.CREATED_AT]: 'createdAt',
  [DiscordKeys.CREATOR]: 'creator',
  [DiscordKeys.CREATOR_ID]: 'creatorId',
  [DiscordKeys.CURRENCY]: 'currency',
  [DiscordKeys.CUSTOM]: 'custom',
  [DiscordKeys.CUSTOM_ID]: 'customId',
  [DiscordKeys.DATA]: 'data',
  [DiscordKeys.DEAF]: 'deaf',
  [DiscordKeys.DEFAULT]: 'default',
  [DiscordKeys.DEFAULT_MESSAGE_NOTIFICATIONS]: 'defaultMessageNotifications',
  [DiscordKeys.DEFAULT_PERMISSION]: 'defaultPermission',
  [DiscordKeys.DELETE_MEMBER_DAYS]: 'deleteMemberDays',
  [DiscordKeys.DENY]: 'deny',
  [DiscordKeys.DENY_NEW]: 'denyNew',
  [DiscordKeys.DEPENDENT_SKU_ID]: 'dependentSkuId',
  [DiscordKeys.DEPRECATED]: 'deprecated',
  [DiscordKeys.DESCRIPTION]: 'description',
  [DiscordKeys.DESKTOP]: 'desktop',
  [DiscordKeys.DETAILS]: 'details',
  [DiscordKeys.DEVELOPERS]: 'developers',
  [DiscordKeys.DISABLED]: 'disabled',
  [DiscordKeys.DISCOVERABLE_DISABLED]: 'discoverableDisabled',
  [DiscordKeys.DISCOVERY_SPLASH]: 'discoverySplash',
  [DiscordKeys.DISCRIMINATOR]: 'discriminator',
  [DiscordKeys.DISTRIBUTOR]: 'distributor',
  [DiscordKeys.EDITED_TIMESTAMP]: 'editedTimestamp',
  [DiscordKeys.EMAIL]: 'email',
  [DiscordKeys.EMBEDS]: 'embeds',
  [DiscordKeys.EMBED_CHANNEL_ID]: 'embedChannelId',
  [DiscordKeys.EMBED_ENABLED]: 'embedEnabled',
  [DiscordKeys.EMOJI]: 'emoji',
  [DiscordKeys.EMOJIS]: 'emojis',
  [DiscordKeys.EMOJI_ID]: 'emojiId',
  [DiscordKeys.EMOJI_NAME]: 'emojiName',
  [DiscordKeys.ENABLED]: 'enabled',
  [DiscordKeys.END]: 'end',
  [DiscordKeys.ENDED]: 'ended',
  [DiscordKeys.ENDED_TIMESTAMP]: 'endedTimestamp',
  [DiscordKeys.ENTITLEMENT_BRANCH_ID]: 'entitlementBranchId',
  [DiscordKeys.EPHEMERAL]: 'ephemeral',
  [DiscordKeys.EULA_ID]: 'eulaId',
  [DiscordKeys.EXECUTABLES]: 'executables',
  [DiscordKeys.EXPIRES_AT]: 'expiresAt',
  [DiscordKeys.EXPIRE_BEHAVIOR]: 'expireBehavior',
  [DiscordKeys.EXPIRE_GRACE_PERIOD]: 'expireGracePeriod',
  [DiscordKeys.EXPLICIT_CONTENT_FILTER]: 'explicitContentFilter',
  [DiscordKeys.FEATURES]: 'features',
  [DiscordKeys.FIELDS]: 'fields',
  [DiscordKeys.FILENAME]: 'filename',
  [DiscordKeys.FLAGS]: 'flags',
  [DiscordKeys.FOCUSED]: 'focused',
  [DiscordKeys.FOOTER]: 'footer',
  [DiscordKeys.FORMAT_TYPE]: 'formatType',
  [DiscordKeys.FRIEND_SYNC]: 'friendSync',
  [DiscordKeys.GAME]: 'game',
  [DiscordKeys.GAME_ID]: 'gameId',
  [DiscordKeys.GENRES]: 'genres',
  [DiscordKeys.GUILD]: 'guild',
  [DiscordKeys.GUILD_ID]: 'guildId',
  [DiscordKeys.GUILD_IDS]: 'guildIds',
  [DiscordKeys.GUILD_SCHEDULED_EVENT_ID]: 'guildScheduledEventId',
  [DiscordKeys.HEADER_BACKGROUND]: 'headerBackground',
  [DiscordKeys.HEADER_LOGO_DARK_THEME]: 'headerLogoDarkTheme',
  [DiscordKeys.HEADER_LOGO_LIGHT_THEME]: 'headerLogoLightTheme',
  [DiscordKeys.HEIGHT]: 'height',
  [DiscordKeys.HERO_BACKGROUND]: 'heroBackground',
  [DiscordKeys.HERO_VIDEO]: 'heroVideo',
  [DiscordKeys.HOIST]: 'hoist',
  [DiscordKeys.HOISTED_ROLE]: 'hoistedRole',
  [DiscordKeys.HOOK]: 'hook',
  [DiscordKeys.ICON]: 'icon',
  [DiscordKeys.ICON_URL]: 'iconUrl',
  [DiscordKeys.ID]: 'id',
  [DiscordKeys.IDS]: 'ids',
  [DiscordKeys.IMAGE]: 'image',
  [DiscordKeys.INLINE]: 'inline',
  [DiscordKeys.INSTANCE]: 'instance',
  [DiscordKeys.INTEGRATIONS]: 'integrations',
  [DiscordKeys.INTERACTION]: 'interaction',
  [DiscordKeys.INTERVAL]: 'interval',
  [DiscordKeys.INTERVAL_COUNT]: 'intervalCount',
  [DiscordKeys.INVITE_CODE]: 'inviteCode',
  [DiscordKeys.INVITER]: 'inviter',
  [DiscordKeys.IS_DIRTY]: 'isDirty',
  [DiscordKeys.IS_PARTIAL]: 'isPartial',
  [DiscordKeys.IS_PENDING]: 'isPending',
  [DiscordKeys.JOIN]: 'join',
  [DiscordKeys.JOIN_TIMESTAMP]: 'joinTimestamp',
  [DiscordKeys.JOINED_AT]: 'joinedAt',
  [DiscordKeys.KEY]: 'key',
  [DiscordKeys.LABEL]: 'label',
  [DiscordKeys.LARGE]: 'large',
  [DiscordKeys.LARGE_IMAGE]: 'largeImage',
  [DiscordKeys.LARGE_TEXT]: 'largeText',
  [DiscordKeys.LAST_MESSAGE_ID]: 'lastMessageId',
  [DiscordKeys.LAST_MODIFIED]: 'lastModified',
  [DiscordKeys.LAST_PIN_TIMESTAMP]: 'lastPinTimestamp',
  [DiscordKeys.LAZY]: 'lazy',
  [DiscordKeys.LEGAL_NOTICE]: 'legalNotice',
  [DiscordKeys.LOCALE]: 'locale',
  [DiscordKeys.LOCALES]: 'locales',
  [DiscordKeys.LOCKED]: 'locked',
  [DiscordKeys.MANAGED]: 'managed',
  [DiscordKeys.MANIFEST_LABELS]: 'manifestLabels',
  [DiscordKeys.MATCH]: 'match',
  [DiscordKeys.MAX_AGE]: 'maxAge',
  [DiscordKeys.MAX_MEMBERS]: 'maxMembers',
  [DiscordKeys.MAX_PRESENCES]: 'maxPresences',
  [DiscordKeys.MAX_USES]: 'maxUses',
  [DiscordKeys.MAX_VALUES]: 'maxValues',
  [DiscordKeys.MAX_VIDEO_CHANNEL_USERS]: 'maxVideoChannelUsers',
  [DiscordKeys.ME]: 'me',
  [DiscordKeys.MEMBER]: 'member',
  [DiscordKeys.MEMBERS]: 'members',
  [DiscordKeys.MEMBERSHIP_STATE]: 'membershipState',
  [DiscordKeys.MEMBERS_REMOVED]: 'membersRemoved',
  [DiscordKeys.MEMBER_COUNT]: 'memberCount',
  [DiscordKeys.MENTIONABLE]: 'mentionable',
  [DiscordKeys.MENTIONS]: 'mentions',
  [DiscordKeys.MENTION_CHANNELS]: 'mentionChannels',
  [DiscordKeys.MENTION_EVERYONE]: 'mentionEveryone',
  [DiscordKeys.MENTION_ROLES]: 'mentionRoles',
  [DiscordKeys.MESSAGE]: 'message',
  [DiscordKeys.MESSAGES]: 'messages',
  [DiscordKeys.MESSAGE_COUNT]: 'messageCount',
  [DiscordKeys.MESSAGE_ID]: 'messageId',
  [DiscordKeys.MESSAGE_REFERENCE]: 'messageReference',
  [DiscordKeys.METADATA]: 'metadata',
  [DiscordKeys.MFA_ENABLED]: 'mfaEnabled',
  [DiscordKeys.MFA_LEVEL]: 'mfaLevel',
  [DiscordKeys.MIME_TYPE]: 'mimeType',
  [DiscordKeys.MIN_VALUES]: 'minValues',
  [DiscordKeys.MOBILE]: 'mobile',
  [DiscordKeys.MUTE]: 'mute',
  [DiscordKeys.MUTUAL_GUILDS]: 'mutualGuilds',
  [DiscordKeys.NAME]: 'name',
  [DiscordKeys.NEW_VALUE]: 'newValue',
  [DiscordKeys.NICK]: 'nick',
  [DiscordKeys.NICKS]: 'nicks',
  [DiscordKeys.NONCE]: 'nonce',
  [DiscordKeys.NSFW]: 'nsfw',
  [DiscordKeys.NSFW_LEVEL]: 'nsfwLevel',
  [DiscordKeys.OLD_VALUE]: 'oldValue',
  [DiscordKeys.OPTIMAL]: 'optimal',
  [DiscordKeys.OPTIONS]: 'options',
  [DiscordKeys.OS]: 'os',
  [DiscordKeys.OVERLAY]: 'overlay',
  [DiscordKeys.OVERLAY_COMPATIBILITY_HOOK]: 'overlayCompatibilityHook',
  [DiscordKeys.OWNER]: 'owner',
  [DiscordKeys.OWNER_ID]: 'ownerId',
  [DiscordKeys.OWNER_USER_ID]: 'ownerUserId',
  [DiscordKeys.PACK_ID]: 'packId',
  [DiscordKeys.PARENT_ID]: 'parentId',
  [DiscordKeys.PARTICIPANTS]: 'participants',
  [DiscordKeys.PARTY]: 'party',
  [DiscordKeys.PARTY_ID]: 'partyId',
  [DiscordKeys.PAYOUT_ACCOUNT_STATUS]: 'payoutAccountStatus',
  [DiscordKeys.PENDING]: 'pending',
  [DiscordKeys.PERMISSION]: 'permission',
  [DiscordKeys.PERMISSIONS]: 'permissions',
  [DiscordKeys.PERMISSIONS_NEW]: 'permissionsNew',
  [DiscordKeys.PERMISSION_OVERWRITES]: 'permissionOverwrites',
  [DiscordKeys.PHONE]: 'phone',
  [DiscordKeys.PINNED]: 'pinned',
  [DiscordKeys.PLACEHOLDER]: 'placeholder',
  [DiscordKeys.PLATFORM]: 'platform',
  [DiscordKeys.POSITION]: 'position',
  [DiscordKeys.PREFERRED_LOCALE]: 'preferredLocale',
  [DiscordKeys.PREMIUM]: 'premium',
  [DiscordKeys.PREMIUM_GUILD_SINCE]: 'premiumGuildSince',
  [DiscordKeys.PREMIUM_SINCE]: 'premiumSince',
  [DiscordKeys.PREMIUM_SUBSCRIPTION_COUNT]: 'premiumSubscriptionCount',
  [DiscordKeys.PREMIUM_TIER]: 'premiumTier',
  [DiscordKeys.PREMIUM_TYPE]: 'premiumType',
  [DiscordKeys.PRESENCES]: 'presences',
  [DiscordKeys.PREVIEW_ASSET]: 'previewAsset',
  [DiscordKeys.PREVIEW_VIDEO]: 'previewVideo',
  [DiscordKeys.PRICE]: 'price',
  [DiscordKeys.PRIMARY_SKU_ID]: 'primarySkuId',
  [DiscordKeys.PRIVACY_LEVEL]: 'privacyLevel',
  [DiscordKeys.PROVIDER]: 'provider',
  [DiscordKeys.PROXY_ICON_URL]: 'proxyIconUrl',
  [DiscordKeys.PROXY_URL]: 'proxyUrl',
  [DiscordKeys.PUBLIC_FLAGS]: 'publicFlags',
  [DiscordKeys.PUBLIC_UPDATES_CHANNEL_ID]: 'publicUpdatesChannelId',
  [DiscordKeys.PUBLISHERS]: 'publishers',
  [DiscordKeys.RATE_LIMIT_PER_USER]: 'rateLimitPerUser',
  [DiscordKeys.REACTIONS]: 'reactions',
  [DiscordKeys.REASON]: 'reason',
  [DiscordKeys.RECIPIENTS]: 'recipients',
  [DiscordKeys.REDEEMED]: 'redeemed',
  [DiscordKeys.REDIRECT_URIS]: 'redirectUris',
  [DiscordKeys.REFERENCE_ID]: 'referenceId',
  [DiscordKeys.REFERENCED_MESSAGE]: 'referencedMessage',
  [DiscordKeys.REGION]: 'region',
  [DiscordKeys.RELEASE_DATE]: 'releaseDate',
  [DiscordKeys.REQUEST_TO_SPEAK_TIMESTAMP]: 'requestToSpeakTimestamp',
  [DiscordKeys.REQUIRED]: 'required',
  [DiscordKeys.REQUIRE_COLONS]: 'requireColons',
  [DiscordKeys.RESOLVED]: 'resolved',
  [DiscordKeys.REVOKED]: 'revoked',
  [DiscordKeys.RINGING]: 'ringing',
  [DiscordKeys.ROLES]: 'roles',
  [DiscordKeys.ROLE_ID]: 'roleId',
  [DiscordKeys.RPC_APPLICATION_STATE]: 'rpcApplicationState',
  [DiscordKeys.RPC_ORIGINS]: 'rpcOrigins',
  [DiscordKeys.RTC_REGION]: 'rtcRegion',
  [DiscordKeys.RULES_CHANNEL_ID]: 'rulesChannelId',
  [DiscordKeys.SECRET]: 'secret',
  [DiscordKeys.SECRETS]: 'secrets',
  [DiscordKeys.SELF_DEAF]: 'selfDeaf',
  [DiscordKeys.SELF_MUTE]: 'selfMute',
  [DiscordKeys.SELF_STREAM]: 'selfStream',
  [DiscordKeys.SELF_VIDEO]: 'selfVideo',
  [DiscordKeys.SERIALIZED_SOURCE_GUILD]: 'serializedSourceGuild',
  [DiscordKeys.SESSION_ID]: 'sessionId',
  [DiscordKeys.SHOW_ACTIVITY]: 'showActivity',
  [DiscordKeys.SHOW_AGE_GATE]: 'showAgeGate',
  [DiscordKeys.SIZE]: 'size',
  [DiscordKeys.SKU]: 'sku',
  [DiscordKeys.SKU_ID]: 'skuId',
  [DiscordKeys.SLUG]: 'slug',
  [DiscordKeys.SMALL_IMAGE]: 'smallImage',
  [DiscordKeys.SMALL_TEXT]: 'smallText',
  [DiscordKeys.SORT_VALUE]: 'sortValue',
  [DiscordKeys.SOURCE_CHANNEL]: 'sourceChannel',
  [DiscordKeys.SOURCE_GUILD]: 'sourceGuild',
  [DiscordKeys.SOURCE_GUILD_ID]: 'sourceGuildId',
  [DiscordKeys.SPECTATE]: 'spectate',
  [DiscordKeys.SPLASH]: 'splash',
  [DiscordKeys.STAGE_INSTANCES]: 'stageInstances',
  [DiscordKeys.START]: 'start',
  [DiscordKeys.STARTED]: 'started',
  [DiscordKeys.STATE]: 'state',
  [DiscordKeys.STATUS]: 'status',
  [DiscordKeys.STICKERS]: 'stickers',
  [DiscordKeys.STICKER_ITEMS]: 'stickerItems',
  [DiscordKeys.STOPPED]: 'stopped',
  [DiscordKeys.STORE_APPLICATION_STATE]: 'storeApplicationState',
  [DiscordKeys.STORE_LISTING]: 'storeListing',
  [DiscordKeys.STYLE]: 'style',
  [DiscordKeys.SUBSCRIPTION_PLAN]: 'subscriptionPlan',
  [DiscordKeys.SUBSCRIPTION_PLAN_ID]: 'subscriptionPlanId',
  [DiscordKeys.SUBTARGET]: 'subtarget',
  [DiscordKeys.SUMMARY]: 'summary',
  [DiscordKeys.SUPPRESS]: 'suppress',
  [DiscordKeys.SYNCED_AT]: 'syncedAt',
  [DiscordKeys.SYNCING]: 'syncing',
  [DiscordKeys.SYNC_ID]: 'syncId',
  [DiscordKeys.SYSTEM]: 'system',
  [DiscordKeys.SYSTEM_CHANNEL_FLAGS]: 'systemChannelFlags',
  [DiscordKeys.SYSTEM_CHANNEL_ID]: 'systemChannelId',
  [DiscordKeys.SYSTEM_REQUIREMENTS]: 'systemRequirements',
  [DiscordKeys.TAGLINE]: 'tagline',
  [DiscordKeys.TAGS]: 'tags',
  [DiscordKeys.TARGET]: 'target',
  [DiscordKeys.TARGET_APPLICATION]: 'targetApplication',
  [DiscordKeys.TARGET_ID]: 'targetId',
  [DiscordKeys.TARGET_TYPE]: 'targetType',
  [DiscordKeys.TARGET_USER]: 'targetUser',
  [DiscordKeys.TAX_INCLUSIVE]: 'taxInclusive',
  [DiscordKeys.TEAM]: 'team',
  [DiscordKeys.TEAM_ID]: 'teamId',
  [DiscordKeys.TEMPORARY]: 'temporary',
  [DiscordKeys.TEXT]: 'text',
  [DiscordKeys.THIRD_PARTY_SKUS]: 'thirdPartySkus',
  [DiscordKeys.THREAD]: 'thread',
  [DiscordKeys.THREAD_METADATA]: 'threadMetadata',
  [DiscordKeys.THREADS]: 'threads',
  [DiscordKeys.THUMBNAIL]: 'thumbnail',
  [DiscordKeys.TIMEOUT]: 'timeout',
  [DiscordKeys.TIMESTAMP]: 'timestamp',
  [DiscordKeys.TIMESTAMPS]: 'timestamps',
  [DiscordKeys.TITLE]: 'title',
  [DiscordKeys.TOKEN]: 'token',
  [DiscordKeys.TOPIC]: 'topic',
  [DiscordKeys.TTS]: 'tts',
  [DiscordKeys.TYPE]: 'type',
  [DiscordKeys.UNAVAILABLE]: 'unavailable',
  [DiscordKeys.UNICODE_EMOJI]: 'unicodeEmoji',
  [DiscordKeys.UPDATED_AT]: 'updatedAt',
  [DiscordKeys.URL]: 'url',
  [DiscordKeys.USAGE_COUNT]: 'usageCount',
  [DiscordKeys.USER]: 'user',
  [DiscordKeys.USERNAME]: 'username',
  [DiscordKeys.USERS]: 'users',
  [DiscordKeys.USER_ID]: 'userId',
  [DiscordKeys.USER_LIMIT]: 'userLimit',
  [DiscordKeys.USES]: 'uses',
  [DiscordKeys.VALUE]: 'value',
  [DiscordKeys.VALUES]: 'values',
  [DiscordKeys.VANITY_URL_CODE]: 'vanityUrlCode',
  [DiscordKeys.VERIFICATION_LEVEL]: 'verificationLevel',
  [DiscordKeys.VERIFIED]: 'verified',
  [DiscordKeys.VERIFY_KEY]: 'verifyKey',
  [DiscordKeys.VERSION]: 'version',
  [DiscordKeys.VIDEO]: 'video',
  [DiscordKeys.VIDEO_QUALITY_MODE]: 'videoQualityMode',
  [DiscordKeys.VIP]: 'vip',
  [DiscordKeys.VISIBILITY]: 'visibility',
  [DiscordKeys.VOICE_STATES]: 'voiceStates',
  [DiscordKeys.WEB]: 'web',
  [DiscordKeys.WEBHOOK_ID]: 'webhookId',
  [DiscordKeys.WELCOME_CHANNELS]: 'welcomeChannels',
  [DiscordKeys.WELCOME_SCREEN]: 'welcomeScreen',
  [DiscordKeys.WIDGET_CHANNEL_ID]: 'widgetChannelId',
  [DiscordKeys.WIDGET_ENABLED]: 'widgetEnabled',
  [DiscordKeys.WIDTH]: 'width',
  [DiscordKeys.YOUTUBE_TRAILER_VIDEO_ID]: 'youtubeTrailerVideoId',
});


export const COMMAND_RATELIMIT_TYPES: ReadonlyArray<string> = Object.freeze(Object.values(CommandRatelimitTypes));

export const DEFAULT_GROUP_DM_AVATARS: ReadonlyArray<string> = Object.freeze([
  '861ab526aa1fabb04c6b7da8074e3e21',
  'b8912961ea6ab32f0655d583bbc26b4f',
  '773616c3c8a7e21f8a774eb0d5625436',
  'f810dc5fedb7175c43a3389aa890534f',
  'e1fb24a120bdd003a84e021b16ec3bef',
  'b3150d5cef84b9e82128a1131684f287',
  '485a854d5171c8dc98088041626e6fea',
  '1531b79c2f2927945582023e1edaaa11',
]);

export const IMAGE_FORMATS: ReadonlyArray<string> = Object.freeze(Object.values(ImageFormats));
