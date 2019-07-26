export interface GatewayPacket {
  d: any,
  op: number,
  s: number,
  t: string,
}


export interface ActivityJoinInvite {
  secret: string,
  user_id: string,
}

export interface ActivityJoinRequest {
  // maybe more
  user: User,
}

export interface ActivityStart {
  activity: any,
  user_id: string,
}

export interface BraintreePopupBridgeCallback {
  path: string,
  query: any,
  state: string,
}

export interface CallCreate {
  channel_id: string,
  message_id: string,
  region: string,
  ringing: Array<string>,
  voice_states?: Array<VoiceState>,
}

export interface CallDelete {
  channel_id: string,
  unavailable: boolean,
}

export interface CallUpdate {
  channel_id: string,
  message_id: string,
  region: string,
  ringing: Array<string>,
}

export interface ChannelCreate extends Channel {

}

export interface ChannelDelete extends Channel  {

}

export interface ChannelPinsAck {
  channel_id: string,
  timestamp: string,
}

export interface ChannelPinsUpdate {
  channel_id: string,
  guild_id?: string,
  last_pin_timestamp: string,
}

export interface ChannelUpdate extends Channel  {

}

export interface ChannelRecipientAdd {
  channel_id: string,
  nick?: string,
  user: User,
}

export interface ChannelRecipientRemove extends ChannelRecipientAdd {

}

export interface EntitlementCreate extends Entitlement {

}

export interface EntitlementDelete extends Entitlement {

}

export interface EntitlementUpdate extends Entitlement {

}

export interface FriendSuggestionCreate extends FriendSuggestion {

}

export interface FriendSuggestionDelete {
  suggested_user_id: string,
}

export interface GiftCodeUpdate {
  code: string,
  uses: number,
}

export interface GuildBanAdd {
  guild_id: string,
  user: User,
}

export interface GuildBanRemove {
  guild_id: string,
  user: User,
}

export interface GuildCreate extends Guild {

}

export interface GuildDelete {
  id: string,
  unavailable?: boolean,
}

export interface GuildEmojisUpdate {
  guild_id: string,
  emojis: Array<Emoji>,
}

export interface GuildIntegrationsUpdate {
  guild_id: string,
}

export interface GuildMemberAdd {
  guild_id: string,
  user: User,
}

export interface GuildMemberListUpdate {
  groups: Array<{
    count: number,
    id: string,
  }>,
  guild_id: string,
  id: string,
  member_count: number,
  ops: Array<{
    op: 'DELETE' | 'INSERT' | 'SYNC' | 'UPDATE',
    index?: number,
    items?: Array<GuildMemberListUpdateItem>
    item?: GuildMemberListUpdateItem,
    range?: Array<[number, number]>,
  }>,
}

export interface GuildMemberRemove {
  guild_id: string,
  user: User,
}

export interface GuildMemberUpdate {
  guild_id: string,
  nick: null | string,
  premium_since: null | string,
  roles: Array<string>,
  user: User,
}

export interface GuildMembersChunk {
  guild_id: string,
  members: Array<Member>,
  presences?: Array<Presence>,
  not_found?: Array<string>,
}

export interface GuildRoleCreate {
  guild_id: string,
  role: Role,
}

export interface GuildRoleDelete {
  guild_id: string,
  role_id: string,
}

export interface GuildRoleUpdate {
  guild_id: string,
  role: Role,
}

export interface GuildUpdate extends Guild {

}

export interface LibraryApplicationUpdate {
  application: Application,
  branch?: {
    id: string,
    name: string,
  },
  branch_id: string,
  created_at: string,
  entitlements?: Array<Entitlement>,
  flags: number,
  sku: {
    id: string,
    premium: boolean,
    preorder_approximate_release_date: null | string,
    preorder_release_at: null | string,
    type: number,
  },
  sku_id: string,
}

export interface LobbyCreate {
  id: string,
  voice_states: Array<VoiceState>,
}

export interface LobbyDelete {
  id: string,
  reason: string,
}

export interface LobbyUpdate extends LobbyCreate {

}

export interface LobbyMemberConnect {
  lobby_id: string,
  member: {
    metdata: any,
    user: User,
  },
}

export interface LobbyMemberDisconnect {
  lobby_id: string,
  member: {
    metdata: any,
    user: User,
  },
}

export interface LobbyMemberUpdate {
  lobby_id: string,
  member: {
    metdata: any,
    user: User,
  },
}

export interface LobbyMessage {
  data: string,
  lobby_id: string,
  sender_id: string,
}

export interface LobbyVoiceServerUpdate {
  endpoint: string,
  lobby_id: string,
  token: string,
}

export interface LobbyVoiceStateUpdate extends VoiceState {
  lobby_id: string,
}

export interface MessageAck {
  channel_id: string,
  message_id: string,
}

export interface MessageCreate {
  activity?: {
    cover_image?: string,
    name?: string,
    party_id: string,
    type: number,
  },
  application?: {
    cover_image: null | string,
    description: string,
    icon: null | string,
    id: string,
    name: string,
    primary_sku_id: string,
  },
  attachments?: Array<MessageAttachment>,
  author: User,
  call?: {
    ended_timestamp: null | string,
    participiants: Array<string>,
  },
  channel_id: string,
  content: string,
  edited_timestamp?: string,
  embeds?: Array<MessageEmbed>,
  guild_id?: string,
  id: string,
  member?: Member,
  mention_everyone: boolean,
  mention_roles: Array<string>,
  mentions: Array<{
    bot: boolean,
    discriminator: string,
    id: string,
    member?: Member,
    username: string,
  }>,
  message_reference?: {
    channel_id: string,
    guild_id?: string,
    message_id: string,
  },
  nonce: null | string,
  pinned: boolean,
  timestamp: string,
  tts: boolean,
  type: number,
  webhook_id?: string,
}

export interface MessageDelete {
  channel_id: string,
  guild_id?: string,
  id: string,
}

export interface MessageDeleteBulk {
  channel_id: string,
  guild_id?: string,
  ids: Array<string>,
}

export interface MessageReactionAdd {
  channel_id: string,
  emoji: EmojiPartial,
  guild_id?: string,
  message_id: string,
  user_id: string,
}

export interface MessageReactionRemove extends MessageReactionAdd {

}

export interface MessageReactionRemoveAll {
  channel_id: string,
  guild_id?: string,
  message_id: string,
}

export interface MessageUpdate extends MessageCreate {
  
}

export interface Oauth2TokenRevoke {
  access_token: string,
}

export interface PresenceUpdate extends Presence {
  nick?: string,
  premium_since?: null | string,
  roles?: Array<Role>,
}

export interface PresencesReplace {
  presences?: Array<Presence>,
}

export interface Ready {
  _trace: Array<string>,
  analytics_token?: string,
  connected_accounts?: Array<ConnectedAccount>,
  consents?: {
    personalization?: {
      consented: boolean,
    },
    usage_statistics?: {
      consented: boolean,
    },
  },
  experiments?: Array<[
    number,
    number,
    number,
  ]>,
  expiring_subscription_id?: string,
  friend_suggestion_count?: number,
  guild_experiments?: Array<[
    number,
    null,
    number,
    Array<number>,
    Array<number>,
    Array<number>,
  ]>,
  guilds: Array<Guild>,
  notes?: {[key: string]: string},
  presences?: Array<Presence>,
  private_channels: Array<Channel>,
  read_state?: Array<{
    id: string,
    last_message_id: string,
    last_pin_timestamp: string,
    mention_count: number,
  }>,
  relationships?: Array<Relationship>,
  required_action?: string,
  session_id: string,
  sessions?: Array<Session>,
  shard?: Array<[number, number]>,
  tutorial?: {
    indicators_confirmed: Array<any>,
    indicators_suppressed: boolean,
  },
  user: UserMe,
  user_feed_settings?: UserFeedSettings,
  user_guild_settings?: Array<UserGuildSettings>,
  user_settings?: UserSettings,
  v: number,
}

export interface RecentMentionDelete {
  message_id: string,
}

export interface RelationshipAdd extends Relationship {

}

export interface RelationshipRemove {
  id: string,
  type: number,
}

export interface Resumed {
  _trace: Array<string>,
}

export interface SessionsUpdate extends Array<Session> {

}

export interface StreamCreate {
  paused: boolean,
  region: string,
  rtc_server_id: string,
  stream_key: string,
  viewer_ids: Array<string>,
}

export interface StreamDelete {
  reason: string,
  stream_key: string,
  unavailable: boolean,
}

export interface StreamServerUpdate {
  endpoint: string,
  stream_key: string,
  token: string,
}

export interface StreamUpdate {
  paused: boolean,
  region: string,
  stream_key: string,
  viewer_ids: Array<string>,
}

export interface TypingStart {
  channel_id: string,
  guild_id?: string,
  member?: Member,
  timestamp: number,
  user_id: string,
}

export interface UserAchievementUpdate {
  application_id: string,
  achievement: {
    description: string,
    name: string,
  },
  percent_complete: number,
}

export interface UserConnectionsUpdate {
  // null
}

export interface UserFeedSettingsUpdate extends UserFeedSettings {

}

export interface UserGuildSettingsUpdate extends UserGuildSettings {

}

export interface UserNoteUpdate {
  id: string,
  note: string,
}

export interface UserPaymentSourcesUpdate {
  // null
}

export interface UserPaymentsUpdate {
  // null
}

export interface UserRequiredActionUpdate {
  required_action: null | string,
}

export interface UserSettingsUpdate extends UserSettings {

}

export interface UserSubscriptionsUpdate {
  // null
}

export interface UserUpdate extends UserMe {
  // Current User Update
}

export interface VoiceServerUpdate {
  channel_id: string,
  endpoint: string,
  guild_id: string,
  token: string,
}

export interface VoiceStateUpdate extends VoiceState {
  member?: Member,
}

export interface WebhooksUpdate {
  channel_id: string,
  guild_id: string,
}


export interface Application {
  bot_public: boolean,
  bot_require_code_grant: boolean,
  description: null | string,
  developers: Array<{
    id: string,
    name: string,
  }>,
  guild_id: null | string,
  icon: null | string,
  id: string,
  name: string,
  primary_sku_id: string,
  publishers: Array<{
    id: string,
    name: string,
  }>,
  slug: string,
  summary: string,
  verify_key: string,
}

export interface Channel {
  bitrate?: number,
  guild_id?: string,
  id: string,
  last_message_id: null | string,
  last_pin_timestamp?: string,
  name: string,
  nicks?: {[id: string]: string};
  nsfw?: boolean,
  owner_id?: string,
  parent_id?: string,
  permission_overwrites?: Array<ChannelOverwrite>,
  position?: number,
  rate_limit_per_user?: number,
  recipients?: Array<User>,
  topic?: string,
  type: number,
  user_limit?: number,
}

export interface ChannelOverwrite {
  allow: number,
  deny: number,
  id: string,
  type: 'member' | 'role',
}

export interface ConnectedAccount {
  friend_sync: boolean,
  id: string,
  integrations?: Array<any>,
  name: string,
  revoked: boolean,
  show_activity: boolean,
  type: string,
  verified: boolean,
  visibility: number,
}

export interface EmojiPartial {
  animated: boolean,
  id: null | string,
  name: string,
}

export interface Emoji extends EmojiPartial {
  available: boolean,
  managed: boolean,
  required_colons: boolean,
  roles: Array<string>,
}

export interface Entitlement {
  application_id: string,
  branches: Array<string>,
  id: string,
  sku_id: string,
  type: number,
  user_id: string,
}

export interface FriendSuggestion {
  reasons: Array<{
    name: string,
    platform_type: string,
  }>,
  suggested_user: User,
}

export interface Guild {
  afk_channel_id: null | string,
  afk_timeout: number,
  application_id: null | string,
  banner: null | string,
  default_message_notifications: number,
  embed_channel_id: null | string,
  embed_enabled: boolean,
  emojis: Array<Emoji>,
  explicit_content_filter: number,
  features: Array<string>,
  guild_id: string,
  icon: null | string,
  id: string,
  max_members: number,
  max_presences: number,
  mfa_level: number,
  name: string,
  owner_id: string,
  preferred_locale: null | string,
  premium_subscription_count: number,
  premium_tier: number,
  region: string,
  roles: Array<Role>,
  splash: null | string,
  system_channel_flags: number,
  system_channel_id: null | string,
  unavailable: boolean,
  vanity_url_code: null | string,
  verification_level: number,
  voice_states?: Array<VoiceState>,
  widget_channel_id: null | number,
  widget_enabled: boolean,
}

export interface GuildMemberListUpdateItem {
  group?: {
    count: number,
    id: string,
  },
  member?: Member,
}

export interface Member {
  deaf: boolean,
  joined_at: string,
  mute: boolean,
  nick: null | string,
  premium_since: null | string,
  presence?: Presence, // Guild Member List Update has this
  roles: Array<string>,
  user?: User,
}

export interface MessageAttachment {
  filename: string,
  height: number,
  id: string,
  proxy_url: string,
  size: number,
  url: string,
  width: number,
}

export interface MessageEmbed {
  author?: {
    icon_url?: string,
    name?: string,
    proxy_icon_url?: string,
    url?: string,
  },
  color?: number,
  description?: string,
  fields?: Array<{
    inline?: boolean,
    name: string,
    value: string,
  }>,
  footer?: {
    icon_url?: string,
    proxy_icon_url?: string,
    text: string,
  },
  image?: {
    height?: number,
    proxy_url?: string,
    url?: string,
    width?: number,
  },
  provider?: {
    name?: string,
    url?: string,
  },
  reference_id?: string,
  thumbnail?: {
    height?: number,
    proxy_url?: string,
    url?: string,
    width?: number,
  },
  timestamp?: string,
  title?: string,
  type?: string,
  url?: string,
  video?: {
    height?: number,
    url?: string,
    width?: number,
  },
}

export interface Presence {
  activities: Array<PresenceActivity>,
  client_status: {
    desktop?: string,
    mobile?: string,
    web?: string,
  },
  game: PresenceActivity,
  guild_id?: string,
  last_modified: number,
  status: string,
  user: User,
}

export interface PresenceActivity {
  application_id?: string,
  assets?: {
    large_image?: string,
    large_text?: string,
    small_image?: string,
    small_text?: string,
  },
  created_at?: number,
  details?: string,
  flags?: number,
  id?: string,
  instance?: boolean,
  metadata?: {[key: string]: any},
  name: string,
  party?: {
    id?: string,
    size?: Array<[number, number]>,
  },
  secrets?: {
    join?: string,
    match?: string,
    spectate?: string,
  },
  session_id?: string,
  state?: string,
  sync_id?: string,
  timestamps?: {
    end?: number,
    start: number,
  },
  type: number,
  url?: string,
}

export interface Relationship {
  id: string,
  type: number,
  user: User,
}

export interface Role {
  color: number,
  guild_id?: string,
  hoist: boolean,
  id: string,
  managed: boolean,
  mentionable: boolean,
  name: string,
  permissions: number,
  position: number,
}

export interface Session {
  active?: boolean,
  activities: Array<PresenceActivity>,
  client_info: {
    client: string,
    os: string,
    version: number,
  },
  game: null | PresenceActivity,
  last_modified?: string,
  session_id: string,
  status: string,
}

export interface User {
  discriminator: string,
  id: string,
  name: string,
  bot: boolean,
}

export interface UserMe extends User {
  email: null | string,
  flags: number,
  locale: null | string,
  mfa_enabled: boolean,
  phone: null | string,
  premium_type: number,
  verified: boolean,
}

export interface UserFeedSettings {
  autosubscribed_users: Array<string>,
  subscribed_games: Array<string>,
  subscribed_users: Array<string>,
  unsubscribed_games: Array<string>,
  unsubscribed_users: Array<string>,
}

export interface UserGuildSettings {
  channel_overrides?: {
    [key: string]: {
      channel_id: string,
      message_notifications: number,
      muted: boolean,
    },
  },
  guild_id: string,
  message_notifications: number,
  mobile_push: boolean,
  muted: boolean,
  suppress_everyone: boolean,
}

export interface UserSettings {
  afk_timeout: number,
  animate_emojis: boolean,
  convert_emoticons: boolean,
  default_guilds_restricted: boolean,
  detect_platform_accounts: boolean,
  developer_mode: boolean,
  disable_games_tab: boolean,
  enable_tts_command: boolean,
  explicit_content_filter: number,
  friend_source_flags: {
    all: boolean,
  },
  gif_auto_play: boolean,
  guild_folders: Array<string>,
  guild_positions: Array<string>,
  inline_attachment_media: boolean,
  inline_embed_media: boolean,
  locale: string,
  message_display_compact: boolean,
  render_embeds: boolean,
  render_reactions: boolean,
  restricted_guilds: Array<string>,
  show_current_game: boolean,
  status: string,
  theme: string,
  timezone_offset: number,
}

export interface VoiceState {
  channel_id: string,
  deaf: boolean,
  guild_id?: string,
  mute: boolean,
  self_deaf: boolean,
  self_mute: boolean,
  self_stream: boolean,
  self_video: boolean,
  session_id: string,
  suppress: boolean,
  user_id: string,
}
