import { RestClientEvents } from 'detritus-client-rest';

import { GatewayRawEvents } from './rawevents';

import { ShardClient } from '../client';
import { BaseCollection } from '../collections/basecollection';
import {
  Channel,
  Emoji,
  Guild,
  Invite,
  Member,
  Message,
  Presence,
  Reaction,
  Relationship,
  Role,
  Session,
  Typing,
  User,
  UserMe,
  VoiceCall,
  VoiceState,
} from '../structures';


export namespace GatewayClientEvents {
  export interface ClusterEvent {
    shard: ShardClient,
  }

  export interface Killed {
    error?: Error,
  }

  export interface Raw extends GatewayRawEvents.GatewayPacket {

  }

  export interface RestRequest extends RestClientEvents.RequestPayload {

  }

  export interface RestResponse extends RestClientEvents.ResponsePayload {

  }

  export interface Unknown extends GatewayRawEvents.GatewayPacket {

  }

  export interface Warn {
    error: Error,
  }

  export interface ActivityJoinInvite {

  }

  export interface ActivityJoinRequest {

  }

  export interface ActivityStart {

  }

  export interface BraintreePopupBridgeCallback {

  }

  export interface CallCreate {
    call: VoiceCall,
  }

  export interface CallDelete {
    channelId: string,
  }

  export interface CallUpdate {
    call: VoiceCall,
    channelId: string,
    differences: any | null,
  }

  export interface ChannelCreate {
    channel: Channel,
  }

  export interface ChannelDelete {
    channel: Channel,
  }

  export interface ChannelPinsAck {
    
  }

  export interface ChannelPinsUpdate {
    channel: Channel | null,
    channelId: string,
    guildId: string | undefined,
    lastPinTimestamp: string,
  }

  export interface ChannelUpdate {
    channel: Channel,
    differences: any | null,
  }

  export interface ChannelRecipientAdd {
    channel: Channel | null,
    channelId: string,
    nick: null | string,
    user: User,
  }

  export interface ChannelRecipientRemove {
    channel: Channel | null,
    channelId: string,
    nick: null | string,
    user: User,
  }

  export interface EntitlementCreate {

  }

  export interface EntitlementDelete {

  }

  export interface EntitlementUpdate {

  }

  export interface FriendSuggestionCreate {
    reasons: Array<{
      name: string,
      platformType: string,
    }>,
    user: User,
  }

  export interface FriendSuggestionDelete {
    suggestedUserId: string,
  }

  export interface GatewayReady {
    raw: GatewayRawEvents.Ready,
  }

  export interface GatewayResumed {
    raw: GatewayRawEvents.Resumed,
  }

  export interface GiftCodeUpdate {
    code: string,
    uses: number,
  }

  export interface GuildBanAdd {
    guild: Guild | undefined,
    guildId: string,
    user: User,
  }

  export interface GuildBanRemove {
    guild: Guild | undefined,
    guildId: string,
    user: User,
  }

  export interface GuildCreate {
    fromUnavailable: boolean,
    guild: Guild,
  }

  export interface GuildDelete {
    channels: BaseCollection<string, Channel> | null,
    guild: Guild | null,
    guildId: string,
    isUnavailable: boolean,
  }

  export interface GuildEmojisUpdate {
    emojis: BaseCollection<string, Emoji>,
    emojisOld: BaseCollection<string, Emoji> | null,
    guild: Guild | null,
    guildId: string,
  }

  export interface GuildIntegrationsUpdate {
    guildId: string,
  }

  export interface GuildMemberAdd {
    guildId: string,
    isDuplicate: boolean,
    member: Member,
    userId: string,
  }

  export interface GuildMemberListUpdate {
    raw: GatewayRawEvents.GuildMemberListUpdate,
  }

  export interface GuildMemberRemove {
    guildId: string,
    isDuplicate: boolean,
    member: Member | null,
    user: User,
    userId: string,
  }

  export interface GuildMemberUpdate {
    differences: any | null,
    guildId: string,
    member: Member,
    userId: string,
  }

  export interface GuildMembersChunk {
    guild: Guild | null,
    guildId: string,
    members: BaseCollection<string, Member> | null,
    notFound: Array<string> | null,
    presences: BaseCollection<string, Presence> | null,
  }

  export interface GuildRoleCreate {
    guild: Guild | null,
    guildId: string,
    role: Role,
  }

  export interface GuildRoleDelete {
    guild: Guild | null,
    guildId: string,
    role: null | Role,
    roleId: string,
  }

  export interface GuildRoleUpdate {
    differences: any | null,
    guild: Guild | null,
    guildId: string,
    role: Role,
  }

  export interface GuildUpdate {
    differences: any | null,
    guild: Guild,
  }

  export interface InviteCreate {
    channelId: string,
    guildId: string,
    invite: Invite,
  }

  export interface InviteDelete {
    channelId: string,
    code: string,
    guildId: string,
  }

  export interface LibraryApplicationUpdate {

  }

  export interface LobbyCreate {

  }

  export interface LobbyDelete {

  }

  export interface LobbyUpdate {

  }

  export interface LobbyMemberConnect {

  }

  export interface LobbyMemberDisconnect {

  }

  export interface LobbyMemberUpdate {

  }

  export interface LobbyMessage {

  }

  export interface LobbyVoiceServerUpdate {

  }

  export interface LobbyVoiceStateUpdate {

  }

  export interface MessageAck {

  }

  export interface MessageCreate {
    message: Message,
    typing: null | Typing,
  }

  export interface MessageDelete {
    message: Message | null,
    raw: GatewayRawEvents.MessageDelete,
  }

  export interface MessageDeleteBulk {
    amount: number,
    channelId: string,
    guildId: string | undefined,
    messages: BaseCollection<string, Message | null>,
    raw: GatewayRawEvents.MessageDeleteBulk,
  }

  export interface MessageReactionAdd {
    channelId: string,
    guildId: string | undefined,
    member: Member | null,
    message: Message | null,
    messageId: string,
    raw: GatewayRawEvents.MessageReactionAdd,
    reaction: Reaction,
    user: null | User,
    userId: string,
  }

  export interface MessageReactionRemove {
    channelId: string,
    guildId: string | undefined,
    message: Message | null,
    messageId: string,
    raw: GatewayRawEvents.MessageReactionRemove,
    reaction: Reaction,
    user: null | User,
    userId: string,
  }

  export interface MessageReactionRemoveAll {
    channelId: string,
    guildId: string | undefined,
    message: Message | null,
    messageId: string,
  }

  export interface MessageReactionRemoveEmoji {
    channelId: string,
    guildId: string | undefined,
    message: Message | null,
    messageId: string,
    raw: GatewayRawEvents.MessageReactionRemoveEmoji,
    reaction: Reaction,
  }

  export interface MessageUpdate {
    differences: any | null,
    isEmbedUpdate: boolean,
    message: Message | null,
    raw: GatewayRawEvents.MessageUpdate,
  }

  export interface Oauth2TokenRevoke {

  }

  export interface PresenceUpdate {
    differences: any | null,
    guildId: string | null,
    isGuildPresence: boolean,
    member: Member | null,
    presence: Presence,
    wentOffline: boolean,
  }

  export interface PresencesReplace {
    presences: BaseCollection<string, Presence>,
  }

  export interface RecentMentionDelete {

  }

  export interface RelationshipAdd {
    differences: any | null,
    relationship: Relationship,
    userId: string,
  }

  export interface RelationshipRemove {
    relationship: Relationship,
    userId: string,
  }

  export interface SessionsReplace {
    old: BaseCollection<string, Session>,
    raw: GatewayRawEvents.SessionsReplace,
  }

  export interface StreamCreate {
    paused: boolean,
    region: string,
    rtcServerId: string,
    streamKey: string,
    viewerIds: Array<string>,
  }

  export interface StreamDelete {
    reason: string,
    streamKey: string,
    unavailable: boolean,
  }

  export interface StreamServerUpdate {
    endpoint: string,
    streamKey: string,
    token: string,
  }

  export interface StreamUpdate {
    paused: boolean,
    region: string,
    streamKey: string,
    viewerIds: Array<string>,
  }

  export interface TypingStart {
    channelId: string,
    guildId: string | undefined,
    typing: Typing,
    userId: string,
  }

  export interface TypingStop {
    typing: Typing,
  }

  export interface UserAchievementUpdate {

  }

  export interface UserConnectionsUpdate {

  }

  export interface UserFeedSettingsUpdate {

  }

  export interface UserGuildSettingsUpdate {

  }

  export interface UserNoteUpdate {
    note: string,
    user: null | User,
    userId: string,
  }

  export interface UserPaymentSourcesUpdate {

  }

  export interface UserPaymentsUpdate {

  }

  export interface UserRequiredActionUpdate {
    differences: {requiredAction?: null | string},
    requiredAction: null | string,
  }

  export interface UserUpdate {
    differences: any | null,
    user: UserMe,
  }

  export interface VoiceServerUpdate {
    channelId: string,
    endpoint: string,
    guildId: string | undefined,
    token: string,
  }

  export interface VoiceStateUpdate {
    differences: any | null,
    leftChannel: boolean,
    voiceState: VoiceState,
  }

  export interface WebhooksUpdate {
    channelId: string,
    guildId: string,
  }
}
