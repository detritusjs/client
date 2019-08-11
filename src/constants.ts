import { Endpoints } from 'detritus-client-rest';
import { Constants as SocketConstants } from 'detritus-client-socket';

export const Package = Object.freeze({
  URL: 'https://github.com/detritusjs/client',
  VERSION: '0.4.2',
});

function normalize(object: {[key: string]: any}) {
  for (let key in object) {
    object[key] = key;
  }
  return Object.freeze(object);
}

export type Snowflake = number | string;

export const MAX_BITRATE = 96000;
export const MAX_EMOJI_SLOTS = 50;
export const MAX_EMOJI_SLOTS_MORE = 200;
export const MAX_ATTACHMENT_SIZE = 8 * 1024 * 1024;
export const MAX_ATTACHMENT_SIZE_PREMIUM = 50 * 1024 * 1024;
export const MIN_BITRATE = 8000;


export const ApplicationNewsFlags = Object.freeze({
  PATCH_NOTES: 1 << 1,
  PROMOTION: 1 << 2,
});

export const AuditLogActions = Object.freeze({
  GUILD_UPDATE: 1,
  CHANNEL_CREATE: 10,
  CHANNEL_UPDATE: 11,
  CHANNEL_DELETE: 12,
  CHANNEL_OVERWRITE_CREATE: 13,
  CHANNEL_OVERWRITE_UPDATE: 14,
  CHANNEL_OVERWRITE_DELETE: 15,
  MEMBER_KICK: 20,
  MEMBER_PRUNE: 21,
  MEMBER_BAN_ADD: 22,
  MEMBER_BAN_REMOVE: 23,
  MEMBER_UPDATE: 24,
  MEMBER_ROLE_UPDATE: 25,
  ROLE_CREATE: 30,
  ROLE_UPDATE: 31,
  ROLE_DELETE: 32,
  INVITE_CREATE: 40,
  INVITE_UPDATE: 41,
  INVITE_DELETE: 42,
  WEBHOOK_CREATE: 50,
  WEBHOOK_UPDATE: 51,
  WEBHOOK_DELETE: 52,
  EMOJI_CREATE: 60,
  EMOJI_UPDATE: 61,
  EMOJI_DELETE: 62,
  MESSAGE_DELETE: 72,
});

export const AuditLogActionTypes = normalize({
  ALL: null,
  CREATE: null,
  UPDATE: null,
  DELETE: null,
});

export const AuditLogSubtargetTypes = Object.freeze({
  USER: 'member',
  ROLE: 'role',
});

export const AuditLogTargetTypes = normalize({
  ALL: null,
  GUILD: null,
  CHANNEL: null,
  USER: null,
  ROLE: null,
  INVITE: null,
  WEBHOOK: null,
  EMOJI: null,
});

export const AuditLogChangeKeys = Object.freeze({
  NAME: 'name',
  DESCRIPTION: 'description',
  ICON_HASH: 'icon_hash',
  SPLASH_HASH: 'splash_hash',
  BANNER_HASH: 'banner_hash',
  OWNER_ID: 'owner_id',
  REGION: 'region',
  AFK_CHANNEL_ID: 'afk_channel_id',
  AFK_TIMEOUT: 'afk_timeout',
  SYSTEM_CHANNEL_ID: 'system_channel_id',
  MFA_LEVEL: 'mfa_level',
  WIDGET_ENABLED: 'widget_enabled',
  WIDGET_CHANNEL_ID: 'widget_channel_id',
  VERIFICATION_LEVEL: 'verification_level',
  EXPLICIT_CONTENT_FILTER: 'explicit_content_filter',
  DEFAULT_MESSAGE_NOTIFICATIONS: 'default_message_notifications',
  VANITY_URL_CODE: 'vanity_url_code',
  POSITION: 'position',
  TOPIC: 'topic',
  TYPE: 'type',
  BITRATE: 'bitrate',
  PERMISSION_OVERWRITES: 'permission_overwrites',
  ROLES_ADD: '$add',
  ROLES_REMOVE: '$remove',
  NICK: 'nick',
  DEAF: 'deaf',
  MUTE: 'mute',
  PERMISSIONS: 'permissions',
  COLOR: 'color',
  HOIST: 'hoist',
  MENTIONABLE: 'mentionable',
  CODE: 'code',
  CHANNEL_ID: 'channel_id',
  INVITER_ID: 'inviter_id',
  MAX_USES: 'max_uses',
  USES: 'uses',
  MAX_AGE: 'max_age',
  TEMPORARY: 'temporary',
  APPLICATION_ID: 'application_id',
  AVATAR_HASH: 'avatar_hash',
  ID: 'id',
  PERMISSIONS_GRANTED: 'allow',
  PERMISSIONS_DENIED: 'deny',
  REASON: 'reason',
  PRUNE_DELETE_DAYS: 'prune_delete_days',
  NSFW: 'nsfw',
  RATE_LIMIT_PER_USER: 'rate_limit_per_user',
});

export const ChannelTypes = Object.freeze({
  BASE: -1,
  GUILD_TEXT: 0,
  DM: 1,
  GUILD_VOICE: 2,
  GROUP_DM: 3,
  GUILD_CATEGORY: 4,
  GUILD_NEWS: 5,
  GUILD_STORE: 6,
  GUILD_LFG_LISTINGS: 7,
});

export const ClientEvents = normalize(Object.assign({
  COMMAND_ERROR: null,
  COMMAND_FAIL: null,
  COMMAND_NONE: null,
  COMMAND_RAN: null,
  COMMAND_RATELIMIT: null,
  COMMAND_RUN_ERROR: null,
  GATEWAY_READY: null,
  GATEWAY_RESUMED: null,
  RAW_EVENT: null,
  UNKNOWN: null,
}, SocketConstants.GatewayDispatchEvents));

export const ClusterIPCOpCodes = Object.freeze({
  READY: 0,
  DISCONNECT: 1,
  RECONNECTING: 2,
  RESPAWN_ALL: 3,
  EVAL: 4,
});

export const Colors = Object.freeze({
  BLURPLE: 7506394,
});

export const CommandArgumentTypes = Object.freeze({
  BOOL: 'bool',
  FLOAT: 'float',
  NUMBER: 'number',
  STRING: 'string',
});

export const CommandErrors = Object.freeze({

});

export const CommandRatelimitTypes = Object.freeze({
  CHANNEL: 'channel',
  GUILD: 'guild',
  USER: 'user',
});

export const COMMAND_RATELIMIT_TYPES: ReadonlyArray<string> = Object.freeze(Object.values(CommandRatelimitTypes));

export const DISCORD_EPOCH = 1420070400000;

export const DiscordOpusFormat = Object.freeze({
  CHANNELS: 2,
  SAMPLE_RATE: 48000,
});

export const DiscordRegexNames = normalize({
  EMOJI: null,
  MENTION_CHANNEL: null,
  MENTION_ROLE: null,
  MENTION_USER: null,
  TEXT_BOLD: null,
  TEXT_CODEBLOCK: null,
  TEXT_CODESTRING: null,
  TEXT_ITALICS: null,
  TEXT_SNOWFLAKE: null,
  TEXT_SPOILER: null,
  TEXT_STRIKE: null,
  TEXT_UNDERLINE: null,
  TEXT_URL: null,
});

export const DiscordRegex = Object.freeze({
  [DiscordRegexNames.EMOJI]: /^<a?:(\w+):(\d+)>$/,
  [DiscordRegexNames.MENTION_CHANNEL]: /^<#(\d+)>$/,
  [DiscordRegexNames.MENTION_ROLE]: /^<@&(\d+)>$/,
  [DiscordRegexNames.MENTION_USER]: /^<@!?(\d+)>$/,
  [DiscordRegexNames.TEXT_BOLD]: /\*\*([\s\S]+?)\*\*/,
  [DiscordRegexNames.TEXT_CODEBLOCK]: /```(([a-z0-9-]+?)\n+)?\n*([^]+?)\n*```/i,
  [DiscordRegexNames.TEXT_CODESTRING]: /`([\s\S]+?)`/,
  [DiscordRegexNames.TEXT_ITALICS]: /_([\s\S]+?)_|\*([\s\S]+?)\*/,
  [DiscordRegexNames.TEXT_SNOWFLAKE]: /^(\d+)$/,
  [DiscordRegexNames.TEXT_SPOILER]: /\|\|([\s\S]+?)\|\|/,
  [DiscordRegexNames.TEXT_STRIKE]: /~~([\s\S]+?)~~(?!_)/,
  [DiscordRegexNames.TEXT_UNDERLINE]: /__([\s\S]+?)__/,
  [DiscordRegexNames.TEXT_URL]: /^((?:https?):\/\/[^\s<]+[^<.,:;"'\]\s])$/,
});

export const Distributors = Object.freeze({
  BATTLENET: 'battlenet',
  DISCORD: 'discord',
  EPIC: 'epic',
  GOG: 'gog',
  ORIGIN: 'origin',
  STEAM: 'steam',
  TWITCH: 'twitch',
  UPLAY: 'uplay',
});

export const DistributorNames = Object.freeze({
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
export const DistributorUrls = Object.freeze({
  [Distributors.BATTLENET]: (skuId: string) =>
    `https://shop.battle.net/family/${encodeURIComponent(skuId)}`,
  [Distributors.DISCORD]: (skuId: string, slug?: null | string) =>
    Endpoints.Routes.URL + Endpoints.Routes.APPLICATION_STORE_LISTING_SKU(skuId, slug || undefined),
  [Distributors.EPIC]: (skuId: string) =>
    `https://epicgames.com/store/product/${encodeURIComponent(skuId)}`,
  [Distributors.GOG]: (skuId: string) =>
    `https://gog.com/game/${skuId}`,
  [Distributors.ORIGIN]: (skuId: string) =>
    `https://origin.com/search?searchString=${encodeURIComponent(skuId)}`,
  [Distributors.STEAM]: (skuId: string) =>
    `https://store.steampowered.com/app/${encodeURIComponent(skuId)}`,
  [Distributors.UPLAY]: (skuId: string) =>
    `https://store.ubi.com/search/?q=${encodeURIComponent(skuId)}`,
});

export const GuildExplicitContentFilterTypes = Object.freeze({
  DISABLED: 0,
  MEMBERS_WITHOUT_ROLES: 1,
  ALL_MEMBERS: 2,
});

export const GuildFeatures = normalize({
  ANIMATED_ICON: null,
  BANNER: null,
  COMMERCE: null,
  DISCOVERABLE: null,
  FEATURABLE: null,
  INVITE_SPLASH: null,
  LURKABLE: null,
  MORE_EMOJI: null,
  NEWS: null,
  PARTNERED: null,
  VANITY_URL: null,
  VERIFIED: null,
  VIP_REGIONS: null,
});

export const ImageFormats = Object.freeze({
  GIF: 'gif',
  JPEG: 'jpeg',
  JPG: 'jpg',
  PNG: 'png',
  WEBP: 'webp',
});

export const IMAGE_FORMATS: ReadonlyArray<string> = Object.freeze(Object.values(ImageFormats));

export const InviteTargetUserTypes = Object.freeze({
  STREAM: 1,
});

export const LobbyErrors = Object.freeze({
  NO_ERROR: 0,
  UNKNOWN_ERROR: 1,
  SERVICE_UNAVAILABLE: 2,
  NOT_FOUND: 3,
  INVALID_SECRET: 4,
  FULL: 5,
  LOBBY_LIMIT_REACHED: 6,
  ALREADY_CONNECTING: 7,
});

export const LobbyTypes = Object.freeze({
  PRIVATE: 1,
  PUBLIC: 2,
});

export const MessageCacheTypes = Object.freeze({
  CHANNEL: 'channel',
  GLOBAL: 'global',
  GUILD: 'guild',
});

export const MESSAGE_CACHE_TYPES: ReadonlyArray<string> = Object.freeze(Object.values(MessageCacheTypes));

export const MessageFlags = Object.freeze({
  CROSSPOSTED: 1 << 0,
  IS_CROSSPOST: 1 << 1,
});

export const MessageTypes = Object.freeze({
  BASE: -1,
  DEFAULT: 0,
  RECIPIENT_ADD: 1,
  RECIPIENT_REMOVE: 2,
  CALL: 3,
  CHANNEL_NAME_CHANGE: 4,
  CHANNEL_ICON_CHANGE: 5,
  CHANNEL_PINNED_MESSAGE: 6,
  GUILD_MEMBER_JOIN: 7,
  GUILD_PREMIUM_SUBSCRIPTION: 8,
  GUILD_PREMIUM_SUBSCRIPTION_TIER_1: 9,
  GUILD_PREMIUM_SUBSCRIPTION_TIER_2: 10,
  GUILD_PREMIUM_SUBSCRIPTION_TIER_3: 11,
});

export const MessageTypesDeletable = Object.freeze({
  [MessageTypes.BASE]: true,
  [MessageTypes.DEFAULT]: true,
  [MessageTypes.CHANNEL_PINNED_MESSAGE]: true,
  [MessageTypes.GUILD_MEMBER_JOIN]: true,
  [MessageTypes.GUILD_PREMIUM_SUBSCRIPTION]: true,
  [MessageTypes.GUILD_PREMIUM_SUBSCRIPTION_TIER_1]: true,
  [MessageTypes.GUILD_PREMIUM_SUBSCRIPTION_TIER_2]: true,
  [MessageTypes.GUILD_PREMIUM_SUBSCRIPTION_TIER_3]: true,
});

export const MessageEmbedTypes = Object.freeze({
  APPLICATION_NEWS: 'application_news',
  ARTICLE: 'article',
  GIFV: 'gifv',
  IMAGE: 'image',
  LINK: 'link',
  RICH: 'rich',
  TWEET: 'tweet',
  VIDEO: 'video',
});

export const MfaLevels = Object.freeze({
  NONE: 0,
  ELEVATED: 1,
});

export const OverwriteTypes = Object.freeze({
  MEMBER: 'member',
  ROLE: 'role',
});


export const Permissions = Object.freeze({
  NONE: 0,
  CREATE_INSTANT_INVITE: 1 << 0,
  KICK_MEMBERS: 1 << 1,
  BAN_MEMBERS: 1 << 2,
  ADMINISTRATOR: 1 << 3,
  MANAGE_CHANNELS: 1 << 4,
  MANAGE_GUILD: 1 << 5,
  ADD_REACTIONS: 1 << 6,
  VIEW_AUDIT_LOG: 1 << 7,
  PRIORITY_SPEAKER: 1 << 8,
  STREAM: 1 << 9,
  VIEW_CHANNEL: 1 << 10,
  SEND_MESSAGES: 1 << 11,
  SEND_TTS_MESSAGES: 1 << 12,
  MANAGE_MESSAGES: 1 << 13,
  EMBED_LINKS: 1 << 14,
  ATTACH_FILES: 1 << 15,
  READ_MESSAGE_HISTORY: 1 << 16,
  MENTION_EVERYONE: 1 << 17,
  USE_EXTERNAL_EMOJIS: 1 << 18,
  // unreleased feature 1 << 19
  CONNECT: 1 << 20,
  SPEAK: 1 << 21,
  MUTE_MEMBERS: 1 << 22,
  DEAFEN_MEMBERS: 1 << 23,
  MOVE_MEMBERS: 1 << 24,
  USE_VAD: 1 << 25,
  CHANGE_NICKNAME: 1 << 26,
  CHANGE_NICKNAMES: 1 << 27,
  MANAGE_ROLES: 1 << 28,
  MANAGE_WEBHOOKS: 1 << 29,
  MANAGE_EMOJIS: 1 << 30,
});

export const PERMISSIONS_ALL = Object.values(Permissions).reduce(
  (permissions: number, permission: number) => permissions | permission,
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
].reduce(
  (permissions: number, permission: number) => permissions | permission,
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
].reduce(
  (permissions: number, permission: number) => permissions | permission,
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
  (permissions: number, permission: number) => permissions | permission,
  Permissions.NONE,
);

export const PERMISSIONS_LURKER = [
  Permissions.VIEW_CHANNEL,
  Permissions.READ_MESSAGE_HISTORY,
].reduce(
  (permissions: number, permission: number) => permissions | permission,
  Permissions.NONE,
);


export const PlatformTypes = Object.freeze({
  BATTLENET: 'battlenet',
  FACEBOOK: 'facebook',
  LEAGUE_OF_LEGENDS: 'leagueoflegends',
  REDDIT: 'reddit',
  SKYPE: 'skype',
  SPOTIFY: 'spotify',
  STEAM: 'steam',
  TWITCH: 'twitch',
  TWITTER: 'twitter',
  YUOTUBE: 'youtube',
  XBOX: 'xbox',
});

export const PremiumGuildTiers = Object.freeze({
  NONE: 0,
  TIER_1: 1,
  TIER_2: 2,
  TIER_3: 3,
});

export const PremiumGuildTierNames = Object.freeze({
  [PremiumGuildTiers.NONE]: '',
  [PremiumGuildTiers.TIER_1]: 'Level 1',
  [PremiumGuildTiers.TIER_2]: 'Level 2',
  [PremiumGuildTiers.TIER_3]: 'Level 3',
});

export const PremiumGuildSubscriptionsRequired = Object.freeze({
  [PremiumGuildTiers.NONE]: 0,
  [PremiumGuildTiers.TIER_1]: 2,
  [PremiumGuildTiers.TIER_2]: 10,
  [PremiumGuildTiers.TIER_3]: 50,
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

export const PremiumTypes = Object.freeze({
  NONE: 0,
  TIER_1: 1,
  TIER_2: 2,
});

export const RelationshipTypes = Object.freeze({
  NONE: 0,
  FRIEND: 1,
  BLOCKED: 2,
  PENDING_INCOMING: 3,
  PENDING_OUTGOING: 4,
  IMPLICIT: 5,
});

export const SpecialUrls = Object.freeze({
  SPOTIFY_TRACK: (trackId: string): string =>
    `https://open.spotify.com/track/${encodeURIComponent(trackId)}`,
});

export const SPOILER_ATTACHMENT_PREFIX = 'SPOILER_';

export const SystemMessages = Object.freeze({
  CallMissed: 'You missed a call from :user:.',
  CallStarted: ':user: started a call.',
  ChannelIconChange: ':user: changed the channel name: **:name:**',
  ChannelNameChange: ':user: changed the channel icon.',
  PinnedMessage: ':user: pinned a message to this channel.',
  RecipientAdd: ':user: added :user2: to the group.',
  RecipientRemove: ':user: removed :user2: from the group.',
  RecipientRemoveSelf: ':user: left the group.',
  GuildMemberJoin: [
    ":user: just joined the server - glhf!",
    ":user: just joined. Everyone, look busy!",
    ":user: just joined. Can I get a heal?",
    ":user: joined your party.",
    ":user: joined. You must construct additional pylons.",
    "Ermagherd. :user: is here.",
    "Welcome, :user:. Stay awhile and listen.",
    "Welcome, :user:. We were expecting you ( ͡° ͜ʖ ͡°)",
    "Welcome, :user:. We hope you brought pizza.",
    "Welcome :user:. Leave your weapons by the door.",
    "A wild :user: appeared.",
    "Swoooosh. :user: just landed.",
    "Brace yourselves. :user: just joined the server.",
    ":user: just joined. Hide your bananas.",
    ":user: just arrived. Seems OP - please nerf.",
    ":user: just slid into the server.",
    "A :user: has spawned in the server.",
    "Big :user: showed up!",
    "Where’s :user:? In the server!",
    ":user: hopped into the server. Kangaroo!!",
    ":user: just showed up. Hold my beer.",
    "Challenger approaching - :user: has appeared!",
    "It's a bird! It's a plane! Nevermind, it's just :user:.",
    "It's :user:! Praise the sun! \\\\[T]/",
    "Never gonna give :user: up. Never gonna let :user: down.",
    "Ha! :user: has joined! You activated my trap card!",
    "Cheers, love! :user:'s here!",
    "Hey! Listen! :user: has joined!",
    "We've been expecting you :user:",
    "It's dangerous to go alone, take :user:!",
    ":user: has joined the server! It's super effective!",
    "Cheers, love! :user: is here!",
    ":user: is here, as the prophecy foretold.",
    ":user: has arrived. Party's over.",
    "Ready player :user:",
    ":user: is here to kick butt and chew bubblegum. And :user: is all out of gum.",
    "Hello. Is it :user: you're looking for?",
    ":user: has joined. Stay a while and listen!",
    "Roses are red, violets are blue, :user: joined this server with you",
  ],
  GuildMemberSubscribed: ':user: just boosted the server!',
  GuildMemberSubscribedAchievedTier: ':user: just boosted the server! :guild: has achieved **:premiumTier:!**',
});

export const TeamMembershipStates = Object.freeze({
  BASE: 0,
  INVITED: 1,
  ACCEPTED: 2,
});

export const TeamPayoutAccountStatuses = Object.freeze({
  BASE: -2,
  UNSUBMITTED: -1,
  PENDING: 2,
  ACTION_REQUIRED: 3,
  ACTIVE: 4,
  BLOCKED: 5,
  SUSPENDED: 6,
});

export const TYPING_TIMEOUT = 10000;

export const UserFlags = Object.freeze({
  STAFF: 1 << 0,
  PARTNER: 1 << 1,
  HYPESQUAD: 1 << 2,
  BUG_HUNTER: 1 << 3,
  MFA_SMS: 1 << 4,
  PREMIUM_PROMO_DISMISSED: 1 << 5,
  HYPESQUAD_ONLINE_HOUSE_1: 1 << 6,
  HYPESQUAD_ONLINE_HOUSE_2: 1 << 7,
  HYPESQUAD_ONLINE_HOUSE_3: 1 << 8,
  PREMIUM_EARLY_SUPPORTER: 1 << 9,
  TEAM_USER: 1 << 10,
});

export const UserRequiredActions = normalize({
  AGREEMENTS: null,
  REQUIRE_CAPTCHA: null,
  REQUIRE_VERIFIED_EMAIL: null,
  REQUIRE_VERIFIED_PHONE: null,
});

export const VerificationLevels = Object.freeze({
  NONE: 0,
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  VERY_HIGH: 4,
});
