import { Snowflake } from '../constants';


export namespace GatewayRawEvents {
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
    user: RawUser,
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
    voice_states?: Array<RawVoiceState>,
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

  export interface ChannelCreate extends RawChannel {

  }

  export interface ChannelDelete extends RawChannel  {

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

  export interface ChannelUpdate extends RawChannel  {

  }

  export interface ChannelRecipientAdd {
    channel_id: string,
    nick?: string,
    user: RawUser,
  }

  export interface ChannelRecipientRemove extends ChannelRecipientAdd {

  }

  export interface EntitlementCreate extends RawEntitlement {

  }

  export interface EntitlementDelete extends RawEntitlement {

  }

  export interface EntitlementUpdate extends RawEntitlement {

  }

  export interface FriendSuggestionCreate extends RawFriendSuggestion {

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
    user: RawUser,
  }

  export interface GuildBanRemove {
    guild_id: string,
    user: RawUser,
  }

  export interface GuildCreate extends RawGuild {

  }

  export interface GuildDelete {
    id: string,
    unavailable?: boolean,
  }

  export interface GuildEmojisUpdate {
    guild_id: string,
    emojis: Array<RawEmoji>,
  }

  export interface GuildIntegrationsUpdate {
    guild_id: string,
  }

  export interface GuildMemberAdd {
    guild_id: string,
    user: RawUser,
  }

  export interface GuildMemberListUpdate {
    groups: Array<{
      count: number,
      id: string,
    }>,
    guild_id: string,
    id: string,
    member_count: number,
    online_count: number,
    ops: Array<{
      op: 'DELETE' | 'INSERT' | 'SYNC' | 'UPDATE',
      index?: number,
      items?: Array<RawGuildMemberListUpdateItem>
      item?: RawGuildMemberListUpdateItem,
      range?: Array<[number, number]>,
    }>,
  }

  export interface GuildMemberRemove {
    guild_id: string,
    user: RawUser,
  }

  export interface GuildMemberUpdate {
    guild_id: string,
    nick: null | string,
    premium_since: null | string,
    roles: Array<string>,
    user: RawUser,
  }

  export interface GuildMembersChunk {
    guild_id: string,
    members: Array<RawMember>,
    presences?: Array<RawPresence>,
    not_found?: Array<Snowflake>,
  }

  export interface GuildRoleCreate {
    guild_id: string,
    role: RawRole,
  }

  export interface GuildRoleDelete {
    guild_id: string,
    role_id: string,
  }

  export interface GuildRoleUpdate {
    guild_id: string,
    role: RawRole,
  }

  export interface GuildUpdate extends RawGuild {

  }

  export interface LibraryApplicationUpdate {
    application: RawApplication,
    branch?: {
      id: string,
      name: string,
    },
    branch_id: string,
    created_at: string,
    entitlements?: Array<RawEntitlement>,
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
    voice_states: Array<RawVoiceState>,
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
      user: RawUser,
    },
  }

  export interface LobbyMemberDisconnect {
    lobby_id: string,
    member: {
      metdata: any,
      user: RawUser,
    },
  }

  export interface LobbyMemberUpdate {
    lobby_id: string,
    member: {
      metdata: any,
      user: RawUser,
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

  export interface LobbyVoiceStateUpdate extends RawVoiceState {
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
    attachments?: Array<RawMessageAttachment>,
    author: RawUser,
    call?: {
      ended_timestamp: null | string,
      participiants: Array<string>,
    },
    channel_id: string,
    content: string,
    edited_timestamp?: string,
    embeds?: Array<RawMessageEmbed>,
    guild_id?: string,
    id: string,
    member?: RawMemberWithoutUser,
    mention_channels?: Array<RawChannel>,
    mention_everyone: boolean,
    mention_roles: Array<string>,
    mentions: Array<{
      bot: boolean,
      discriminator: string,
      id: string,
      member?: RawMemberWithoutUser,
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
    emoji: RawEmojiPartial,
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

  export interface PresenceUpdate extends RawPresence {
    nick?: string,
    premium_since?: null | string,
    roles?: Array<string>,
  }

  export interface PresencesReplace {
    presences?: Array<RawPresence>,
  }

  export interface Ready {
    _trace: Array<string>,
    analytics_token?: string,
    connected_accounts?: Array<RawConnectedAccount>,
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
    guilds: Array<RawGuild>,
    notes?: {[key: string]: string},
    presences?: Array<RawPresence>,
    private_channels: Array<RawChannel>,
    read_state?: Array<{
      id: string,
      last_message_id: string,
      last_pin_timestamp: string,
      mention_count: number,
    }>,
    relationships?: Array<RawRelationship>,
    required_action?: string,
    session_id: string,
    sessions?: Array<RawSession>,
    shard?: Array<[number, number]>,
    tutorial?: {
      indicators_confirmed: Array<any>,
      indicators_suppressed: boolean,
    },
    user: RawUserMe,
    user_feed_settings?: RawUserFeedSettings,
    user_guild_settings?: Array<RawUserGuildSettings>,
    user_settings?: RawUserSettings,
    v: number,
  }

  export interface RecentMentionDelete {
    message_id: string,
  }

  export interface RelationshipAdd extends RawRelationship {

  }

  export interface RelationshipRemove {
    id: string,
    type: number,
  }

  export interface Resumed {
    _trace: Array<string>,
  }

  export interface SessionsReplace extends Array<RawSession> {

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
    member?: RawMember,
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

  export interface UserFeedSettingsUpdate extends RawUserFeedSettings {

  }

  export interface UserGuildSettingsUpdate extends RawUserGuildSettings {

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

  export interface UserSettingsUpdate extends RawUserSettings {

  }

  export interface UserSubscriptionsUpdate {
    // null
  }

  export interface UserUpdate extends RawUserMe {
    // Current User Update
  }

  export interface VoiceServerUpdate {
    channel_id: string,
    endpoint: string,
    guild_id: string,
    token: string,
  }

  export interface VoiceStateUpdate extends RawVoiceState {
    member?: RawMember,
  }

  export interface WebhooksUpdate {
    channel_id: string,
    guild_id: string,
  }


  export interface RawApplication {
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

  export interface RawChannel {
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
    permission_overwrites?: Array<RawChannelOverwrite>,
    position?: number,
    rate_limit_per_user?: number,
    recipients?: Array<RawUser>,
    topic?: string,
    type: number,
    user_limit?: number,
  }

  export interface RawChannelOverwrite {
    allow: number,
    deny: number,
    id: string,
    type: 'member' | 'role',
  }

  export interface RawConnectedAccount {
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

  export interface RawEmojiPartial {
    animated: boolean,
    id: null | string,
    name: string,
  }

  export interface RawEmoji extends RawEmojiPartial {
    available: boolean,
    managed: boolean,
    require_colons: boolean,
    roles: Array<string>,
  }

  export interface RawEntitlement {
    application_id: string,
    branches: Array<string>,
    id: string,
    sku_id: string,
    type: number,
    user_id: string,
  }

  export interface RawFriendSuggestion {
    reasons: Array<{
      name: string,
      platform_type: string,
    }>,
    suggested_user: RawUser,
  }

  export interface RawGuild {
    afk_channel_id: null | string,
    afk_timeout: number,
    application_id: null | string,
    banner: null | string,
    channels: Array<RawChannel>,
    default_message_notifications: number,
    embed_channel_id: null | string,
    embed_enabled: boolean,
    emojis: Array<RawEmoji>,
    explicit_content_filter: number,
    features: Array<string>,
    guild_id: string,
    icon: null | string,
    id: string,
    max_members: number,
    max_presences: number,
    members: Array<RawMember>,
    member_count: number,
    mfa_level: number,
    name: string,
    owner_id: string,
    preferred_locale: null | string,
    premium_subscription_count: number,
    premium_tier: number,
    presences: Array<RawPresence>,
    region: string,
    roles: Array<RawRole>,
    splash: null | string,
    system_channel_flags: number,
    system_channel_id: null | string,
    unavailable: boolean,
    vanity_url_code: null | string,
    verification_level: number,
    voice_states?: Array<RawVoiceState>,
    widget_channel_id: null | number,
    widget_enabled: boolean,
  }

  export interface RawGuildMemberListUpdateItem {
    group?: {
      count: number,
      id: string,
    },
    member?: RawMember,
  }

  export interface RawMemberWithoutUser {
    deaf: boolean,
    joined_at: string,
    mute: boolean,
    nick: null | string,
    premium_since: null | string,
    presence?: RawPresence, // Guild Member List Update has this
    roles: Array<string>,
  }

  export interface RawMember extends RawMemberWithoutUser {
    user: RawUser,
  }

  export interface RawMessageAttachment {
    filename: string,
    height: number,
    id: string,
    proxy_url: string,
    size: number,
    url: string,
    width: number,
  }

  export interface RawMessageEmbed {
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

  export interface RawPresence {
    activities: Array<RawPresenceActivity>,
    client_status: {
      desktop?: string,
      mobile?: string,
      web?: string,
    },
    game: RawPresenceActivity,
    guild_id?: string,
    last_modified?: number,
    status: string,
    user: RawUserPartial,
  }

  export interface RawPresenceActivity {
    application_id?: string,
    assets?: {
      large_image?: string,
      large_text?: string,
      small_image?: string,
      small_text?: string,
    },
    created_at?: number,
    details?: string,
    emoji?: {
      animated: boolean,
      id: null | string,
      name: string,
    },
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
      start?: number,
    },
    type: number,
    url?: string,
  }

  export interface RawRelationship {
    id: string,
    type: number,
    user: RawUser,
  }

  export interface RawRole {
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

  export interface RawSession {
    active?: boolean,
    activities: Array<RawPresenceActivity>,
    client_info: {
      client: string,
      os: string,
      version: number,
    },
    game: null | RawPresenceActivity,
    last_modified?: string,
    session_id: string,
    status: string,
  }

  export interface RawUserPartial {
    bot?: boolean,
    discriminator?: string,
    id: string,
    username?: string,
  }

  export interface RawUser {
    avatar: null | string,
    bot: boolean,
    discriminator: string,
    id: string,
    username: string,
  }

  export interface RawUserMe extends RawUser {
    email: null | string,
    flags: number,
    locale: null | string,
    mfa_enabled: boolean,
    phone: null | string,
    premium_type: number,
    verified: boolean,
  }

  export interface RawUserFeedSettings {
    autosubscribed_users: Array<string>,
    subscribed_games: Array<string>,
    subscribed_users: Array<string>,
    unsubscribed_games: Array<string>,
    unsubscribed_users: Array<string>,
  }

  export interface RawUserGuildSettings {
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

  export interface RawUserSettings {
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

  export interface RawVoiceState {
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
}
