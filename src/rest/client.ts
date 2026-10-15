import {
  Client,
  ClientOptions,
  RequestTypes,
  RestClientEvents,
} from 'detritus-client-rest';
import { AuthTypes, RestEvents } from 'detritus-client-rest/lib/constants';

import { ShardClient } from '../client';
import { BaseCollection } from '../collections/basecollection';
import { ClientEvents, DiscordKeys, InteractionCallbackTypes, MessageFlags } from '../constants';
import { getResponseInteractionId } from '../gateway/handlercomponent';
import { InteractionModal, createComponentListenerOrNone } from '../utils';

import {
  Application,
  ApplicationActivityInstance,
  ApplicationCommand,
  ApplicationCommandPermissions,
  ApplicationNews,
  ApplicationRoleConnectionMetadata,
  AttachmentDeferred,
  AuditLog,
  AutoModerationRule,
  Channel,
  ChannelDM,
  ChannelDMGroup,
  ChannelGuildThread,
  ConnectedAccount,
  Emoji,
  Entitlement,
  Gift,
  Guild,
  GuildBan,
  GuildMe,
  GuildScheduledEvent,
  GuildScheduledEventUser,
  Integration,
  InteractionCallbackResponse,
  Invite,
  Member,
  Message,
  PremiumSubscription,
  Profile,
  Role,
  Sku,
  SoundboardSound,
  StageInstance,
  Sticker,
  Subscription,
  StoreApplicationAsset,
  StoreListing,
  Team,
  TeamMember,
  Template,
  ThreadMember,
  User,
  UserMe,
  UserWithBanner,
  VoiceRegion,
  Webhook,
  createChannelFromData,
} from '../structures';

import { RestResponses } from './types';


/**
 * OR the IS_COMPONENTS_V2 flag into an interaction response payload without clobbering existing flags
 * `toJSON`-able payloads are wrapped so the flag gets added to their serialized output
 */
function addComponentsV2Flag(payload: any): any {
  if (typeof(payload.toJSON) === 'function') {
    return {
      toJSON: () => {
        const json = payload.toJSON() || {};
        return Object.assign({}, json, {flags: (json.flags || 0) | MessageFlags.IS_COMPONENTS_V2});
      },
    };
  }
  payload.flags = (payload.flags || 0) | MessageFlags.IS_COMPONENTS_V2;
  return payload;
}

export class RestClient {
  readonly client: ShardClient;
  readonly raw: Client;

  constructor(
    token: string,
    options: ClientOptions,
    client: ShardClient,
  ) {
    this.raw = new Client(token, options);

    this.client = client;
    Object.defineProperty(this, 'client', {enumerable: false, writable: false});

    this.raw.on(RestEvents.REQUEST, (payload: RestClientEvents.RequestPayload) => this.client.emit(ClientEvents.REST_REQUEST, payload));
    this.raw.on(RestEvents.RESPONSE, (payload: RestClientEvents.ResponsePayload) => this.client.emit(ClientEvents.REST_RESPONSE, payload));
  }

  get isBot(): boolean {
    return this.raw.isBot;
  }

  get isUser(): boolean {
    return this.raw.isUser;
  }

  setAuthType(type: AuthTypes | string) {
    return this.raw.setAuthType(type);
  }

  async request(
    info: RequestTypes.Options | string | URL,
    init?: RequestTypes.Options,
  ) {
    return this.raw.request(info, init);
  }

  async delete(
    info: RequestTypes.Options | string | URL,
    init?: RequestTypes.Options,
  ) {
    return this.raw.delete(info, init);
  }

  async get(
    info: RequestTypes.Options | string | URL,
    init?: RequestTypes.Options,
  ) {
    return this.raw.get(info, init);
  }

  async head(
    info: RequestTypes.Options | string | URL,
    init?: RequestTypes.Options,
  ) {
    return this.raw.head(info, init);
  }

  async options(
    info: RequestTypes.Options | string | URL,
    init?: RequestTypes.Options,
  ) {
    return this.raw.options(info, init);
  }

  async patch(
    info: RequestTypes.Options | string | URL,
    init?: RequestTypes.Options,
  ) {
    return this.raw.patch(info, init);
  }

  async post(
    info: RequestTypes.Options | string | URL,
    init?: RequestTypes.Options,
  ) {
    return this.raw.post(info, init);
  }

  async put(
    info: RequestTypes.Options | string | URL,
    init?: RequestTypes.Options,
  ) {
    return this.raw.put(info, init);
  }

  /* -- Rest Requests Start -- */

  acceptAgreements(
    privacy: boolean = true,
    terms: boolean = true,
  ) {
    return this.raw.acceptAgreements(privacy, terms);
  }

  acceptInvite(code: string) {
    return this.raw.acceptInvite(code);
  }

  acceptTeamInvite(token: string) {
    return this.raw.acceptTeamInvite(token);
  }

  ackChannelMessage(
    channelId: string,
    messageId: string,
    token: string,
  ) {
    return this.raw.ackChannelMessage(channelId, messageId, token);
  }

  ackChannelPins(channelId: string) {
    return this.raw.ackChannelPins(channelId);
  }

  ackGuild(guildId: string) {
    return this.raw.ackGuild(guildId);
  }

  async acceptTemplate(
    templateId: string,
    options: RequestTypes.AcceptTemplate,
  ): Promise<Guild> {
    const data = await this.raw.acceptTemplate(templateId, options);
    let guild: Guild;
    if (this.client.guilds.has(data.id)) {
      guild = this.client.guilds.get(data.id)!;
      guild.merge(data);
    } else {
      guild = new Guild(this.client, data);
      this.client.guilds.insert(guild);
    }
    return guild;
  }

  activateOauth2ApplicationLicense(
    applicationId: string,
    options: RequestTypes.ActivateOauth2ApplicationLicense,
  ) {
    return this.raw.activateOauth2ApplicationLicense(applicationId, options);
  }

  addConnection(
    platform: string,
    accountId: string,
    options: RequestTypes.AddConnection,
  ) {
    return this.raw.addConnection(platform, accountId, options);
  }

  addGuildMember(
    guildId: string,
    userId: string,
    options: RequestTypes.AddGuildMember,
  ) {
    return this.raw.addGuildMember(guildId, userId, options);
  }

  addGuildMemberRole(
    guildId: string,
    userId: string,
    roleId: string,
    options: RequestTypes.AddGuildMemberRole = {},
  ) {
    return this.raw.addGuildMemberRole(guildId, userId, roleId, options);
  }

  addInviteTargetUser(
    code: string,
    userId: string,
  ) {
    return this.raw.addInviteTargetUser(code, userId);
  }

  addPinnedMessage(
    channelId: string,
    messageId: string,
    options: RequestTypes.PinMessage = {},
  ) {
    return this.raw.addPinnedMessage(channelId, messageId, options);
  }

  addRecipient(
    channelId: string,
    userId: string,
    options: RequestTypes.AddRecipient = {},
  ) {
    return this.raw.addRecipient(channelId, userId, options);
  }

  addOauth2ApplicationWhitelistUser(
    applicationId: string,
    options: RequestTypes.AddOauth2ApplicationWhitelistUser,
  ) {
    return this.raw.addOauth2ApplicationWhitelistUser(applicationId, options);
  }

  addTeamMember(
    teamId: string,
    options: RequestTypes.AddTeamMember,
  ) {
    return this.raw.addTeamMember(teamId, options);
  }

  addThreadMember(
    channelId: string,
    userId: string,
  ) {
    return this.raw.addThreadMember(channelId, userId);
  }

  authorizeIpAddress(
    options: RequestTypes.AuthorizeIpAddress,
  ) {
    return this.raw.authorizeIpAddress(options);
  }

  beginGuildPrune(
    guildId: string,
    options: RequestTypes.BeginGuildPrune = {},
  ) {
    return this.raw.beginGuildPrune(guildId, options);
  }

  bulkAddInviteTargetUsers(
    code: string,
    options: RequestTypes.BulkAddInviteTargetUsers,
  ) {
    return this.raw.bulkAddInviteTargetUsers(code, options);
  }

  bulkDeleteInviteTargetUsers(
    code: string,
    options: RequestTypes.BulkDeleteInviteTargetUsers,
  ) {
    return this.raw.bulkDeleteInviteTargetUsers(code, options);
  }

  bulkDeleteMessages(
    channelId: string,
    messageIds: Array<string>,
    options: RequestTypes.BulkDeleteMessages = {},
  ) {
    return this.raw.bulkDeleteMessages(channelId, messageIds, options);
  }

  async bulkGuildBan(
    guildId: string,
    options: RequestTypes.BulkGuildBan,
  ): Promise<RestResponses.BulkGuildBan> {
    const data = await this.raw.bulkGuildBan(guildId, options);
    return {
      bannedUsers: data.banned_users,
      failedUsers: data.failed_users,
    };
  }

  async bulkOverwriteApplicationCommands(
    applicationId: string,
    commands: Array<RequestTypes.CreateApplicationCommand>,
  ): Promise<BaseCollection<string, ApplicationCommand>> {
    const data = await this.raw.bulkOverwriteApplicationCommands(applicationId, commands);
    const collection = new BaseCollection<string, ApplicationCommand>();

    for (let raw of data) {
      const command = new ApplicationCommand(this.client, raw);
      collection.set(command.id, command);
    }
    return collection;
  }

  async bulkOverwriteApplicationGuildCommands(
    applicationId: string,
    guildId: string,
    commands: Array<RequestTypes.CreateApplicationGuildCommand>,
  ): Promise<BaseCollection<string, ApplicationCommand>> {
    const data = await this.raw.bulkOverwriteApplicationGuildCommands(applicationId, guildId, commands);
    const collection = new BaseCollection<string, ApplicationCommand>();

    for (let raw of data) {
      const command = new ApplicationCommand(this.client, raw);
      collection.set(command.id, command);
    }
    return collection;
  }

  async bulkOverwriteApplicationGuildCommandsPermissions(
    applicationId: string,
    guildId: string,
    permissions: RequestTypes.BulkOverwriteApplicationGuildCommandsPermissions,
  ): Promise<BaseCollection<string, ApplicationCommandPermissions>> {
    const data = await this.raw.bulkOverwriteApplicationGuildCommandsPermissions(applicationId, guildId, permissions);
    const collection = new BaseCollection<string, ApplicationCommandPermissions>();

    for (let raw of data) {
      const commandPermissions = new ApplicationCommandPermissions(this.client, raw);
      collection.set(commandPermissions.id, commandPermissions);
    }
    return collection;
  }

  async bulkOverwriteApplicationRoleConnectionsMetadata(
    applicationId: string,
    metadata: Array<
      RequestTypes.BulkOverwriteApplicationRoleConnectionsMetadataRecord |
      RequestTypes.toJSON<RequestTypes.BulkOverwriteApplicationRoleConnectionsMetadataRecordData>
    >,
  ): Promise<BaseCollection<string, ApplicationRoleConnectionMetadata>> {
    const data = await this.raw.bulkOverwriteApplicationRoleConnectionsMetadata(applicationId, metadata);
    const collection = new BaseCollection<string, ApplicationRoleConnectionMetadata>();
    for (let raw of data) {
      const record = new ApplicationRoleConnectionMetadata(this.client, raw);
      collection.set(record.key, record);
    }
    return collection;
  }

  connectionCallback(
    platform: string,
    options: RequestTypes.ConnectionCallback,
  ) {
    return this.raw.connectionCallback(platform, options);
  }

  consumeApplicationEntitlement(
    applicationId: string,
    entitlementId: string,
  ) {
    return this.raw.consumeApplicationEntitlement(applicationId, entitlementId);
  }

  createApplicationCommand(
    applicationId: string,
    options: RequestTypes.CreateApplicationCommand,
  ) {
    return this.raw.createApplicationCommand(applicationId, options);
  }

  async createApplicationEmoji(
    applicationId: string,
    options: RequestTypes.CreateApplicationEmoji,
  ): Promise<Emoji> {
    const data = await this.raw.createApplicationEmoji(applicationId, options);
    const emoji = new Emoji(this.client, data);
    this.client.applicationEmojis.insert(emoji);
    return emoji;
  }

  createApplicationEntitlement(
    applicationId: string,
    options: RequestTypes.CreateApplicationEntitlement,
  ) {
    return this.raw.createApplicationEntitlement(applicationId, options);
  }

  createApplicationGuildCommand(
    applicationId: string,
    guildId: string,
    options: RequestTypes.CreateApplicationCommand,
  ) {
    return this.raw.createApplicationGuildCommand(applicationId, guildId, options);
  }

  async createApplicationNews(
    options: RequestTypes.CreateApplicationNews,
  ): Promise<ApplicationNews> {
    const data = await this.raw.createApplicationNews(options);
    return new ApplicationNews(this.client, data);
  }

  async createChannelAttachments(
    channelId: string,
    options: RequestTypes.CreateChannelAttachments,
  ): Promise<{attachments: BaseCollection<string, AttachmentDeferred>}>  {
    const data = await this.raw.createChannelAttachments(channelId, options);

    const attachments = new BaseCollection<string, AttachmentDeferred>();
    for (let raw of data.attachments) {
      const attachment = new AttachmentDeferred(this.client, raw);
      attachments.set(attachment.uploadFilename, attachment);
    }

    return {attachments};
  }

  async createChannelInvite(
    channelId: string,
    options: RequestTypes.CreateChannelInvite = {},
  ): Promise<Invite> {
    const data = await this.raw.createChannelInvite(channelId, options);
    return new Invite(this.client, data);
  }

  async createChannelMessageThread(
    channelId: string,
    messageId: string,
    options: RequestTypes.CreateChannelMessageThread,
  ): Promise<ChannelGuildThread> {
    const data = await this.raw.createChannelMessageThread(channelId, messageId, options);
    let channel: ChannelGuildThread;
    if (this.client.channels.has(data.id)) {
      channel = this.client.channels.get(data.id) as ChannelGuildThread;
      channel.merge(data);
    } else {
      channel = createChannelFromData(this.client, data) as ChannelGuildThread;
      this.client.channels.insert(channel);
    }
    return channel;
  }

  createChannelStoreListingGrantEntitlement(
    channelId: string,
  ) {
    return this.raw.createChannelStoreListingGrantEntitlement(channelId);
  }

  async createChannelThread(
    channelId: string,
    options: RequestTypes.CreateChannelThread,
  ): Promise<ChannelGuildThread> {
    const data = await this.raw.createChannelThread(channelId, options);
    let channel: ChannelGuildThread;
    if (this.client.channels.has(data.id)) {
      channel = this.client.channels.get(data.id) as ChannelGuildThread;
      channel.merge(data);
    } else {
      channel = createChannelFromData(this.client, data) as ChannelGuildThread;
      this.client.channels.insert(channel);
    }
    return channel;
  }

  async createDm(
    options: RequestTypes.CreateDm = {},
  ): Promise<ChannelDM | ChannelDMGroup> {
    const data = await this.raw.createDm(options);
    let channel: ChannelDM | ChannelDMGroup;
    if (this.client.channels.has(data.id)) {
      channel = this.client.channels.get(data.id) as ChannelDM | ChannelDMGroup;
      channel.merge(data);
    } else {
      channel = createChannelFromData(this.client, data) as ChannelDM | ChannelDMGroup;
      this.client.channels.insert(channel);
    }
    return channel;
  }

  async createGuild(
    options: RequestTypes.CreateGuild,
  ): Promise<Guild> {
    const data = await this.raw.createGuild(options);
    let guild: Guild;
    if (this.client.guilds.has(data.id)) {
      guild = this.client.guilds.get(data.id)!;
      guild.merge(data);
    } else {
      guild = new Guild(this.client, data);
      this.client.guilds.insert(guild);
    }
    return guild;
  }

  async createGuildAutoModerationRule(
    guildId: string,
    options: RequestTypes.CreateGuildAutoModerationRule,
  ): Promise<AutoModerationRule> {
    const data = await this.raw.createGuildAutoModerationRule(guildId, options);
    data.guild_id = guildId;
    return new AutoModerationRule(this.client, data);
  }

  createGuildBan(
    guildId: string,
    userId: string,
    options: RequestTypes.CreateGuildBan = {},
  ) {
    return this.raw.createGuildBan(guildId, userId, options);
  }

  async createGuildChannel(
    guildId: string,
    options: RequestTypes.CreateGuildChannel,
    updateCache: boolean = true,
  ): Promise<Channel> {
    const data = await this.raw.createGuildChannel(guildId, options);
    let channel: Channel;
    if (updateCache && this.client.channels.has(data.id)) {
      channel = this.client.channels.get(data.id)!;
      channel.merge(data);
    } else {
      channel = createChannelFromData(this.client, data);
      if (updateCache) {
        this.client.channels.insert(channel);
      }
    }
    return channel;
  }

  async createGuildEmoji(
    guildId: string,
    options: RequestTypes.CreateGuildEmoji,
    updateCache: boolean = true,
  ): Promise<Emoji> {
    const data = await this.raw.createGuildEmoji(guildId, options);

    let emoji: Emoji;
    if (updateCache && this.client.emojis.has(guildId, data.id)) {
      emoji = this.client.emojis.get(guildId, data.id)!;
      emoji.merge(data);
    } else {
      data.guild_id = guildId;
      emoji = new Emoji(this.client, data);
      if (updateCache) {
        this.client.emojis.insert(emoji);
      }
    }
    return emoji;
  }

  async createGuildScheduledEvent(
    guildId: string,
    options: RequestTypes.CreateGuildScheduledEvent,
  ): Promise<GuildScheduledEvent> {
    const data = await this.raw.createGuildScheduledEvent(guildId, options);
    return new GuildScheduledEvent(this.client, data);
  }

  async createGuildSticker(
    guildId: string,
    options: RequestTypes.CreateGuildSticker,
  ): Promise<Sticker> {
    const data = await this.raw.createGuildSticker(guildId, options);
    return new Sticker(this.client, data);
  }

  createGuildIntegration(
    guildId: string,
    options: RequestTypes.CreateGuildIntegration,
  ) {
    return this.raw.createGuildIntegration(guildId, options);
  }

  async createGuildRole(
    guildId: string,
    options: RequestTypes.CreateGuildRole = {},
  ): Promise<Role> {
    const data = await this.raw.createGuildRole(guildId, options);
    data.guild_id = guildId;
    const role = new Role(this.client, data);
    if (this.client.guilds.has(guildId)) {
      const guild = this.client.guilds.get(guildId)!;
      guild.roles.set(role.id, role);
    }
    return role;
  }

  async createGuildTemplate(
    guildId: string,
    options: RequestTypes.CreateGuildTemplate,
  ): Promise<Template> {
    const data = await this.raw.createGuildTemplate(guildId, options);
    return new Template(this.client, data);
  }

  async createInteractionResponse(
    interactionId: string,
    token: string,
    options: (RequestTypes.CreateInteractionResponse & {data?: {listenerId?: string}}) | InteractionModal | number,
    data?: (RequestTypes.CreateInteractionResponseInnerPayload & {listenerId?: string}) | InteractionModal | string,
  ) {
    if (options instanceof InteractionModal) {
      options = {data: options as RequestTypes.CreateInteractionResponseInnerPayload, type: InteractionCallbackTypes.MODAL};
    }
    if (data instanceof InteractionModal) {
      options = {data, type: InteractionCallbackTypes.MODAL};
      // the modal is in options now
      data = undefined;
    }

    if (typeof(options) === 'object' && options.data instanceof InteractionModal) {
      const listener = options.data;
      const rawData = await this.raw.createInteractionResponse(interactionId, token, options, data);
      // scope the listener to the user who opened it, so modals sharing a custom id don't overwrite each other
      const interaction = this.client.interactions.get(interactionId);
      this.client.gatewayHandler._handlers.modal.insert(listener, (interaction) ? interaction.userId : undefined);
      return this._createInteractionCallbackResponse(interactionId, rawData);
    } else {
      if (typeof(data) === 'string') {
        data = {content: data};
      }
      const optionsData: any = (typeof(options) === 'object') ? options.data : undefined;
      // look at the payload the way the raw client will merge it, a plain `data` gets assigned onto a plain `options.data`
      let mergedData: any = optionsData;
      if (data) {
        if ('toJSON' in data || !optionsData || 'toJSON' in optionsData) {
          mergedData = data;
        } else {
          mergedData = Object.assign({}, optionsData, data);
        }
      }
      // if type is edit message, do not use interactionId (maybe fetch message id if listenerId isnt given)
      const listenerData = createComponentListenerOrNone(mergedData, interactionId);
      if (listenerData && listenerData[2]) {
        if (data) {
          // the raw client merges a plain `data` into a plain `options.data` (Object.assign), so carry over the caller's flags
          if (!('toJSON' in data) && optionsData && !('toJSON' in optionsData) && (data as any).flags === undefined) {
            (data as any).flags = optionsData.flags;
          }
          data = addComponentsV2Flag(data);
        } else if (typeof(options) === 'object' && optionsData) {
          options.data = addComponentsV2Flag(optionsData);
        } else {
          data = {flags: MessageFlags.IS_COMPONENTS_V2};
        }
      }

      const rawData = await this.raw.createInteractionResponse(interactionId, token, options, data);
      if (listenerData) {
        const [lId, listener] = listenerData;
        const listenerId = lId || interactionId;
        if (listener) {
          listener.id = listenerId;
          this.client.gatewayHandler._handlers.component.insert(listener);
        } else {
          this.client.gatewayHandler._handlers.component.delete(listenerId);
        }
      }
      return this._createInteractionCallbackResponse(interactionId, rawData);
    }
  }

  _createInteractionCallbackResponse(
    interactionId: string,
    data: any,
  ): InteractionCallbackResponse | null {
    if (!data) {
      return null;
    }
    if (data.resource && data.resource.message) {
      const interaction = this.client.interactions.get(interactionId);
      if (interaction && interaction.guildId) {
        data.resource.message[DiscordKeys.GUILD_ID] = interaction.guildId;
      }
    }
    return new InteractionCallbackResponse(this.client, data);
  }

  createLobby(
    applicationIdOrOptions: RequestTypes.CreateLobby | string = {},
    options: RequestTypes.CreateLobby = {},
  ) {
    return this.raw.createLobby(applicationIdOrOptions, options);
  }

  createLobbyChannelInvite(
    lobbyId: string,
    userId: string = '@me',
  ) {
    return this.raw.createLobbyChannelInvite(lobbyId, userId);
  }

  createLobbyMessage(
    lobbyId: string,
    options: RequestTypes.CreateLobbyMessage,
  ) {
    return this.raw.createLobbyMessage(lobbyId, options);
  }

  createOrJoinLobby(
    options: RequestTypes.CreateOrJoinLobby,
  ) {
    return this.raw.createOrJoinLobby(options);
  }

  async createGuildSoundboardSound(
    guildId: string,
    options: RequestTypes.CreateGuildSoundboardSound,
  ): Promise<SoundboardSound> {
    const data = await this.raw.createGuildSoundboardSound(guildId, options);
    data[DiscordKeys.GUILD_ID] = guildId;
    const sound = new SoundboardSound(this.client, data);
    this.client.soundboardSounds.insert(sound);
    return sound;
  }

  createMeBillingPaymentSource(
    options: RequestTypes.CreateMeBillingPaymentSource,
  ) {
    return this.raw.createMeBillingPaymentSource(options);
  }

  createMeBillingSubscription(
    options: RequestTypes.CreateMeBillingSubscription,
  ) {
    return this.raw.createMeBillingSubscription(options);
  }

  /**
   * Message objects from the rest api don't have a `guild_id`, fill it in so the message knows its guild
   * from the caller (an interaction/webhook knows it), the message we already have cached, or its cached channel
   */
  fillMessageGuildId(raw: any, guildId?: null | string): void {
    if (!raw || raw.guild_id) {
      return;
    }
    if (guildId) {
      raw.guild_id = guildId;
      return;
    }
    const message = this.client.messages.cache.get(raw.id);
    if (message && message.guildId) {
      raw.guild_id = message.guildId;
      return;
    }
    const channel = this.client.channels.get(raw.channel_id);
    if (channel && channel.guildId) {
      raw.guild_id = channel.guildId;
    }
  }

  async createMessage(
    channelId: string,
    options: RequestTypes.CreateMessage | string = {},
  ): Promise<Message> {
    const listenerData = createComponentListenerOrNone(options);
    if (listenerData && listenerData[2]) {
      if (typeof(options) === 'string') {
        options = {content: options};
      }
      options.flags = (options.flags || 0) | MessageFlags.IS_COMPONENTS_V2;
    }

    const data = await this.raw.createMessage(channelId, options);
    this.fillMessageGuildId(data);

    const message = new Message(this.client, data);
    this.client.messages.insert(message);

    if (listenerData) {
      const [lId, listener] = listenerData;

      const listenerId = lId || message.id;
      if (listener) {
        listener.id = listenerId;
        this.client.gatewayHandler._handlers.component.insert(listener);
      } else {
        this.client.gatewayHandler._handlers.component.delete(listenerId);
      }
    }

    return message;
  }

  createOauth2Application(
    options: RequestTypes.CreateOauth2Application,
  ) {
    return this.raw.createOauth2Application(options);
  }

  createOauth2ApplicationBot(
    applicationId: string,
  ) {
    return this.raw.createOauth2ApplicationBot(applicationId);
  }

  createReaction(
    channelId: string,
    messageId: string,
    emoji: string,
  ) {
    return this.raw.createReaction(channelId, messageId, emoji);
  }

  async createStageInstance(
    options: RequestTypes.CreateStageInstance,
  ): Promise<StageInstance> {
    const data = await this.raw.createStageInstance(options);
    return new StageInstance(this.client, data);
  }

  async createStoreApplicationAsset(
    applicationId: string,
    options: RequestTypes.CreateStoreApplicationAsset,
  ): Promise<StoreApplicationAsset> {
    const data = await this.raw.createStoreApplicationAsset(applicationId, options);
    data.application_id = applicationId;
    return new StoreApplicationAsset(this.client, data);
  }

  createTeam(
    options: RequestTypes.CreateTeam = {},
  ) {
    return this.raw.createTeam(options);
  }

  async createWebhook(
    channelId: string,
    options: RequestTypes.CreateWebhook,
  ): Promise<Webhook> {
    const data = await this.raw.createWebhook(channelId, options);
    return new Webhook(this.client, data);
  }

  async crosspostMessage(
    channelId: string,
    messageId: string,
  ): Promise<Message> {
    const data = await this.raw.crosspostMessage(channelId, messageId);
    if (this.client.channels.has(data.channel_id)) {
      const channel = this.client.channels.get(data.channel_id)!;
      if (channel.guildId) {
        data.guild_id = channel.guildId;
      }
    }
    const message = new Message(this.client, data);
    this.client.messages.insert(message);
    return message;
  }

  deleteAccount(
    options: RequestTypes.DeleteAccount,
  ) {
    return this.raw.deleteAccount(options);
  }

  deleteApplicationCommand(
    applicationId: string,
    commandId: string,
  ) {
    return this.raw.deleteApplicationCommand(applicationId, commandId);
  }

  async deleteApplicationEmoji(
    applicationId: string,
    emojiId: string,
  ) {
    const data = await this.raw.deleteApplicationEmoji(applicationId, emojiId);
    this.client.applicationEmojis.delete(emojiId);
    return data;
  }

  deleteApplicationEntitlement(
    applicationId: string,
    entitlementId: string,
  ) {
    return this.raw.deleteApplicationEntitlement(applicationId, entitlementId);
  }

  deleteApplicationGuildCommand(
    applicationId: string,
    guildId: string,
    commandId: string,
  ) {
    return this.raw.deleteApplicationGuildCommand(applicationId, guildId, commandId);
  }

  async deleteChannel(
    channelId: string,
    options: RequestTypes.DeleteChannel = {},
  ): Promise<Channel> {
    const data = await this.raw.deleteChannel(channelId, options);
    let channel: Channel;
    if (this.client.channels.has(data.id)) {
      channel = this.client.channels.get(data.id)!;
      this.client.channels.delete(data.id);
      channel.merge(data);
    } else {
      channel = createChannelFromData(this.client, data);
    }
    return channel;
  }

  deleteChannelOverwrite(
    channelId: string,
    overwriteId: string,
    options: RequestTypes.DeleteChannelOverwrite = {},
  ) {
    return this.raw.deleteChannelOverwrite(channelId, overwriteId, options);
  }

  deleteConnection(
    platform: string,
    accountId: string,
  ) {
    return this.raw.deleteConnection(platform, accountId);
  }

  deleteGuild(
    guildId: string,
    options: RequestTypes.DeleteGuild = {},
  ) {
    return this.raw.deleteGuild(guildId, options);
  }

  deleteGuildAutoModerationRule(
    guildId: string,
    autoModerationRuleId: string,
    options: RequestTypes.DeleteGuildAutoModerationRule = {},
  ) {
    return this.raw.deleteGuildAutoModerationRule(guildId, autoModerationRuleId, options);
  }

  deleteGuildEmoji(
    guildId: string,
    emojiId: string,
    options: RequestTypes.DeleteGuildEmoji = {},
  ) {
    return this.raw.deleteGuildEmoji(guildId, emojiId, options);
  }

  deleteGuildIntegration(
    guildId: string,
    integrationId: string,
    options: RequestTypes.DeleteGuildIntegration = {},
  ) {
    return this.raw.deleteGuildIntegration(guildId, integrationId, options);
  }

  deleteGuildPremiumSubscription(
    guildId: string,
    subscriptionId: string,
  ) {
    return this.raw.deleteGuildPremiumSubscription(guildId, subscriptionId);
  }

  deleteGuildRole(
    guildId: string,
    roleId: string,
    options: RequestTypes.DeleteGuildRole = {},
  ) {
    return this.raw.deleteGuildRole(guildId, roleId, options);
  }

  deleteGuildScheduledEvent(
    guildId: string,
    scheduledEventId: string,
    options: RequestTypes.DeleteGuildScheduledEvent = {},
  ) {
    return this.raw.deleteGuildScheduledEvent(guildId, scheduledEventId, options);
  }

  deleteGuildSticker(
    guildId: string,
    stickerId: string,
    options: RequestTypes.DeleteGuildSticker = {},
  ) {
    return this.raw.deleteGuildSticker(guildId, stickerId, options);
  }

  deleteGuildTemplate(
    guildId: string,
    templateId: string,
  ) {
    return this.raw.deleteGuildTemplate(guildId, templateId);
  }

  async editGuildTemplate(
    guildId: string,
    templateId: string,
    options: RequestTypes.EditGuildTemplate = {},
  ): Promise<Template> {
    const data = await this.raw.editGuildTemplate(guildId, templateId, options);
    return new Template(this.client, data);
  }

  async syncGuildTemplate(
    guildId: string,
    templateId: string,
  ): Promise<Template> {
    const data = await this.raw.syncGuildTemplate(guildId, templateId);
    return new Template(this.client, data);
  }

  async deleteInvite(
    code: string,
    options: RequestTypes.DeleteInvite = {},
  ): Promise<Invite> {
    const data = await this.raw.deleteInvite(code, options);
    return new Invite(this.client, data);
  }

  deleteLobby(
    lobbyId: string,
  ) {
    return this.raw.deleteLobby(lobbyId);
  }

  deleteMeBillingPaymentSource(
    paymentSourceId: string,
  ) {
    return this.raw.deleteMeBillingPaymentSource(paymentSourceId);
  }

  deleteMeBillingSubscription(
    subscriptionId: string,
  ) {
    return this.raw.deleteMeBillingSubscription(subscriptionId);
  }

  async deleteMessage(
    channelId: string,
    messageId: string,
    options: RequestTypes.DeleteMessage = {},
  ) {
    const data = await this.raw.deleteMessage(channelId, messageId, options);
    if (this.client.messages.has(messageId)) {
      const message = this.client.messages.get(messageId)!;
      message.deleted = true;
    }
    this.client.gatewayHandler._handlers.component.delete(messageId);
    return data;
  }

  deleteOauth2Application(
    applicationId: string,
    options: RequestTypes.DeleteOauth2Application = {},
  ) {
    return this.raw.deleteOauth2Application(applicationId, options);
  }

  deletePinnedMessage(
    channelId: string,
    messageId: string,
    options: RequestTypes.PinMessage = {},
  ) {
    return this.raw.deletePinnedMessage(channelId, messageId, options);
  }

  deleteReactions(
    channelId: string,
    messageId: string,
  ) {
    return this.raw.deleteReactions(channelId, messageId);
  }

  deleteReactionsEmoji(
    channelId: string,
    messageId: string,
    emoji: string,
  ) {
    return this.raw.deleteReactionsEmoji(channelId, messageId, emoji);
  }

  deleteReaction(
    channelId: string,
    messageId: string,
    emoji: string,
    userId: string = '@me',
  ) {
    return this.raw.deleteReaction(channelId, messageId, emoji, userId);
  }

  deleteRelationship(
    userId: string,
  ) {
    return this.raw.deleteRelationship(userId);
  }

  deleteStageInstance(
    channelId: string,
    options: RequestTypes.DeleteStageInstance = {},
  ) {
    return this.raw.deleteStageInstance(channelId, options);
  }

  deleteMeApplicationRoleConnection(
    applicationId: string,
  ) {
    return this.raw.deleteMeApplicationRoleConnection(applicationId);
  }

  editMeApplicationRoleConnection(
    applicationId: string,
    options: RequestTypes.EditMeApplicationRoleConnection = {},
  ) {
    return this.raw.editMeApplicationRoleConnection(applicationId, options);
  }

  fetchMeApplicationRoleConnection(
    applicationId: string,
  ) {
    return this.raw.fetchMeApplicationRoleConnection(applicationId);
  }

  async fetchMeGuildMember(
    guildId: string,
  ): Promise<Member> {
    const data = await this.raw.fetchMeGuildMember(guildId);
    data[DiscordKeys.GUILD_ID] = guildId;
    return new Member(this.client, data, true);
  }

  fetchGuildVoiceState(
    guildId: string,
    userId: string = '@me',
  ) {
    return this.raw.fetchGuildVoiceState(guildId, userId);
  }

  async fetchSkuSubscription(
    skuId: string,
    subscriptionId: string,
  ): Promise<Subscription> {
    const data = await this.raw.fetchSkuSubscription(skuId, subscriptionId);
    return new Subscription(this.client, data);
  }

  async fetchSkuSubscriptions(
    skuId: string,
    options: RequestTypes.FetchSkuSubscriptions = {},
  ): Promise<BaseCollection<string, Subscription>> {
    const data = await this.raw.fetchSkuSubscriptions(skuId, options);
    const collection = new BaseCollection<string, Subscription>();
    for (let raw of data) {
      const subscription = new Subscription(this.client, raw);
      collection.set(subscription.id, subscription);
    }
    return collection;
  }

  async fetchSticker(
    stickerId: string,
  ): Promise<Sticker> {
    const data = await this.raw.fetchSticker(stickerId);
    if (data.guild_id && this.client.stickers.has(data.guild_id, stickerId)) {
      const sticker = this.client.stickers.get(data.guild_id, stickerId)!;
      sticker.merge(data);
      return sticker;
    }
    return new Sticker(this.client, data);
  }

  fetchStickerPack(
    stickerPackId: string,
  ) {
    return this.raw.fetchStickerPack(stickerPackId);
  }

  fetchStickerPacks() {
    return this.raw.fetchStickerPacks();
  }

  deleteStoreApplicationAsset(
    applicationId: string,
    assetId: string,
  ) {
    return this.raw.deleteStoreApplicationAsset(applicationId, assetId);
  }

  deleteTeam(
    teamId: string,
    options: RequestTypes.DeleteTeam = {},
  ) {
    return this.raw.deleteTeam(teamId, options);
  }

  deleteWebhook(
    webhookId: string,
    options: RequestTypes.DeleteWebhook = {},
  ) {
    return this.raw.deleteWebhook(webhookId, options);
  }

  deleteWebhookToken(
    webhookId: string,
    webhookToken: string,
    options: RequestTypes.DeleteWebhook = {},
  ) {
    return this.raw.deleteWebhookToken(webhookId, webhookToken, options);
  }

  async deleteWebhookTokenMessage(
    webhookId: string,
    webhookToken: string,
    messageId: string,
    options: RequestTypes.DeleteWebhookTokenMessage = {},
  ) {
    const data = await this.raw.deleteWebhookTokenMessage(webhookId, webhookToken, messageId, options);
    if (this.client.messages.has(messageId)) {
      const message = this.client.messages.get(messageId)!;
      message.deleted = true;
    }
    this.client.gatewayHandler._handlers.component.delete(messageId);
    return data;
  }

  disableAccount(
    options: RequestTypes.DisableAccount,
  ) {
    return this.raw.disableAccount(options);
  }

  async editApplication(
    options: RequestTypes.EditApplication = {},
    applicationId: string = '@me',
  ): Promise<Application> {
    const data = await this.raw.editApplication(options, applicationId);
    if (applicationId === '@me' || (this.client.application && this.client.application.id === applicationId)) {
      return this.client._mergeOauth2Application(data);
    }
    return new Application(this.client, data);
  }

  async editApplicationCommand(
    applicationId: string,
    commandId: string,
    options: RequestTypes.EditApplicationCommand = {},
  ): Promise<ApplicationCommand>{
    const data = await this.raw.editApplicationCommand(applicationId, commandId, options);
    return new ApplicationCommand(this.client, data);
  }

  async editApplicationEmoji(
    applicationId: string,
    emojiId: string,
    options: RequestTypes.EditApplicationEmoji = {},
  ): Promise<Emoji>{
    const data = await this.raw.editApplicationEmoji(applicationId, emojiId, options);

    let emoji: Emoji;
    if (this.client.applicationEmojis.has(data.id)) {
      emoji = this.client.applicationEmojis.get(data.id)!;
      emoji.merge(data);
    } else {
      emoji = new Emoji(this.client, data);
    }
    return emoji;
  }

  async editApplicationGuildCommand(
    applicationId: string,
    guildId: string,
    commandId: string,
    options: RequestTypes.EditApplicationGuildCommand = {},
  ): Promise<ApplicationCommand> {
    const data = await this.raw.editApplicationGuildCommand(applicationId, guildId, commandId, options);
    return new ApplicationCommand(this.client, data);
  }

  async editApplicationGuildCommandPermissions(
    applicationId: string,
    guildId: string,
    commandId: string,
    options: RequestTypes.EditApplicationGuildCommandPermissions,
  ): Promise<ApplicationCommandPermissions> {
    const data = await this.raw.editApplicationGuildCommandPermissions(applicationId, guildId, commandId, options);
    return new ApplicationCommandPermissions(this.client, data);
  }

  editApplicationNews(
    newsId: string,
    options: RequestTypes.EditApplicationNews = {},
  ) {
    return this.raw.editApplicationNews(newsId, options);
  }

  /* Issue with merging data with these edited objects is that the gateway event wont have differences then */
  async editChannel(
    channelId: string,
    options: RequestTypes.EditChannel = {},
    updateCache: boolean = true,
  ): Promise<Channel> {
    const data = await this.raw.editChannel(channelId, options);
    let channel: Channel;
    if (updateCache && this.client.channels.has(data.id)) {
      channel = this.client.channels.get(data.id)!;
      channel.merge(data);
    } else {
      channel = createChannelFromData(this.client, data);
    }
    return channel;
  }

  editChannelVoiceStatus(
    channelId: string,
    options: RequestTypes.EditChannelVoiceStatus,
  ) {
    return this.raw.editChannelVoiceStatus(channelId, options);
  }

  editChannelOverwrite(
    channelId: string,
    overwriteId: string,
    options: RequestTypes.EditChannelOverwrite = {},
  ) {
    return this.raw.editChannelOverwrite(channelId, overwriteId, options);
  }

  editConnection(
    platform: string,
    accountId: string,
    options: RequestTypes.EditConnection = {},
  ) {
    return this.raw.editConnection(platform, accountId, options);
  }

  async editGuild(
    guildId: string,
    options: RequestTypes.EditGuild = {},
    updateCache: boolean = true,
  ): Promise<Guild> {
    const data = await this.raw.editGuild(guildId, options);
    let guild: Guild;
    if (updateCache && this.client.guilds.has(data.id)) {
      guild = this.client.guilds.get(data.id)!;
      guild.merge(data);
    } else {
      guild = new Guild(this.client, data);
    }
    return guild;
  }

  async editGuildAutoModerationRule(
    guildId: string,
    autoModerationRuleId: string,
    options: RequestTypes.EditGuildAutoModerationRule,
  ): Promise<AutoModerationRule> {
    const data = await this.raw.editGuildAutoModerationRule(guildId, autoModerationRuleId, options);
    data.guild_id = guildId;
    return new AutoModerationRule(this.client, data);
  }

  editGuildChannels(
    guildId: string,
    channels: RequestTypes.EditGuildChannels,
    options: RequestTypes.EditGuildChannelsExtra = {},
  ) {
    return this.raw.editGuildChannels(guildId, channels, options);
  }

  async editGuildEmoji(
    guildId: string,
    emojiId: string,
    options: RequestTypes.EditGuildEmoji = {},
    updateCache: boolean = true,
  ): Promise<Emoji> {
    const data = await this.raw.editGuildEmoji(guildId, emojiId, options);

    let emoji: Emoji;
    if (updateCache && this.client.emojis.has(guildId, data.id)) {
      emoji = this.client.emojis.get(guildId, data.id)!;
      emoji.merge(data);
    } else {
      data.guild_id = guildId;
      emoji = new Emoji(this.client, data);
    }
    return emoji;
  }

  editGuildIntegration(
    guildId: string,
    integrationId: string,
    options: RequestTypes.EditGuildIntegration = {},
  ) {
    return this.raw.editGuildIntegration(guildId, integrationId, options);
  }

  async editGuildMember(
    guildId: string,
    userId: string,
    options: RequestTypes.EditGuildMember = {},
    updateCache: boolean = true,
  ): Promise<Member> {
    const data = await this.raw.editGuildMember(guildId, userId, options);
    let member: Member;
    if (updateCache && this.client.members.has(guildId, userId)) {
      member = this.client.members.get(guildId, userId)!;
      member.merge(data);
    } else {
      data.guild_id = guildId;
      member = new Member(this.client, data);
      if (updateCache) {
        this.client.members.insert(member);
      }
    }
    return member;
  }

  editGuildMemberVerification(
    guildId: string,
    options: RequestTypes.EditGuildMemberVerification = {},
  ) {
    return this.raw.editGuildMemberVerification(guildId, options);
  }

  editGuildMfaLevel(
    guildId: string,
    options: RequestTypes.EditGuildMfaLevel,
  ) {
    return this.raw.editGuildMfaLevel(guildId, options);
  }

  editGuildNick(
    guildId: string,
    nick: string,
    options: RequestTypes.EditGuildNick = {},
  ) {
    return this.raw.editGuildNick(guildId, nick, options);
  }

  async editGuildRole(
    guildId: string,
    roleId: string,
    options: RequestTypes.EditGuildRole = {},
    updateCache: boolean = true,
  ): Promise<Role> {
    const data = await this.raw.editGuildRole(guildId, roleId, options);
    let role: Role;
    if (updateCache && this.client.guilds.has(guildId)) {
      const guild = this.client.guilds.get(guildId)!;
      if (guild.roles.has(data.id)) {
        role = guild.roles.get(data.id)!;
        role.merge(data);
      } else {
        data.guild_id = guildId;
        role = new Role(this.client, data);
        guild.roles.set(role.id, role);
      }
    } else {
      data.guild_id = guildId;
      role = new Role(this.client, data);
    }
    return role;
  }

  async editGuildRolePositions(
    guildId: string,
    roles: RequestTypes.EditGuildRolePositions,
    options: RequestTypes.EditGuildRolePositionsExtra = {},
    updateCache: boolean = true,
  ): Promise<BaseCollection<string, Role>> {
    const data = await this.raw.editGuildRolePositions(guildId, roles, options);

    const collection = new BaseCollection<string, Role>();
    if (updateCache && this.client.guilds.has(guildId)) {
      const guild = this.client.guilds.get(guildId)!;
      guild.roles.clear();
      for (let raw of data) {
        raw.guild_id = guildId;
        const role = new Role(this.client, raw);
        guild.roles.set(role.id, role);
        collection.set(role.id, role);
      }
    } else {
      for (let raw of data) {
        raw.guild_id = guildId;
        const role = new Role(this.client, raw);
        collection.set(role.id, role);
      }
    }
    return collection;
  }

  async editGuildScheduledEvent(
    guildId: string,
    scheduledEventId: string,
    options: RequestTypes.EditGuildScheduledEvent,
  ): Promise<GuildScheduledEvent> {
    const data = await this.raw.editGuildScheduledEvent(guildId, scheduledEventId, options);
    data.guild_id = guildId;
    return new GuildScheduledEvent(this.client, data);
  }

  async editGuildSticker(
    guildId: string,
    stickerId: string,
    options: RequestTypes.EditGuildSticker = {},
    updateCache: boolean = true,
  ): Promise<Sticker> {
    const data = await this.raw.editGuildSticker(guildId, stickerId, options);
    guildId = data.guild_id;

    let sticker: Sticker;
    if (updateCache && this.client.stickers.has(guildId, data.id)) {
      sticker = this.client.stickers.get(guildId, data.id)!;
      sticker.merge(data);
    } else {
      sticker = new Sticker(this.client, data);
    }
    return sticker;
  }

  editGuildVanity(
    guildId: string,
    code: string,
    options: RequestTypes.EditGuildVanity = {},
  ) {
    return this.raw.editGuildVanity(guildId, code, options);
  }

  editGuildVoiceState(
    guildId: string,
    userId: string,
    options: RequestTypes.EditGuildVoiceState,
  ) {
    return this.raw.editGuildVoiceState(guildId, userId, options);
  }

  editGuildWidget(
    guildId: string,
    options: RequestTypes.EditGuildWidget,
  ) {
    return this.raw.editGuildWidget(guildId, options);
  }

  editLobby(
    lobbyId: string,
    options: RequestTypes.EditLobby = {},
  ) {
    return this.raw.editLobby(lobbyId, options);
  }

  editLobbyChannelLinking(
    lobbyId: string,
    options: RequestTypes.EditLobbyChannelLinking = {},
  ) {
    return this.raw.editLobbyChannelLinking(lobbyId, options);
  }

  editLobbyMember(
    lobbyId: string,
    userId: string,
    options: RequestTypes.EditLobbyMember = {},
  ) {
    return this.raw.editLobbyMember(lobbyId, userId, options);
  }

  editLobbyMembersBulk(
    lobbyId: string,
    members: RequestTypes.EditLobbyMembersBulk,
  ) {
    return this.raw.editLobbyMembersBulk(lobbyId, members);
  }

  editLobbyMessageModerationMetadata(
    lobbyId: string,
    messageId: string,
    metadata: Record<string, string>,
  ) {
    return this.raw.editLobbyMessageModerationMetadata(lobbyId, messageId, metadata);
  }

  async editGuildSoundboardSound(
    guildId: string,
    soundId: string,
    options: RequestTypes.EditGuildSoundboardSound = {},
  ): Promise<SoundboardSound> {
    const data = await this.raw.editGuildSoundboardSound(guildId, soundId, options);
    return this._mergeSoundboardSound(guildId, data);
  }

  async deleteGuildSoundboardSound(
    guildId: string,
    soundId: string,
    options: RequestTypes.DeleteGuildSoundboardSound = {},
  ) {
    const data = await this.raw.deleteGuildSoundboardSound(guildId, soundId, options);
    if (this.client.soundboardSounds.has(guildId, soundId)) {
      this.client.soundboardSounds.delete(guildId, soundId);
    }
    return data;
  }

  _mergeSoundboardSound(guildId: string, data: any): SoundboardSound {
    data[DiscordKeys.GUILD_ID] = guildId;

    let sound: SoundboardSound;
    if (this.client.soundboardSounds.has(guildId, data.sound_id)) {
      sound = this.client.soundboardSounds.get(guildId, data.sound_id)!;
      sound.merge(data);
    } else {
      sound = new SoundboardSound(this.client, data);
      this.client.soundboardSounds.insert(sound);
    }
    return sound;
  }

  async fetchApplicationSkus(
    applicationId: string,
  ): Promise<BaseCollection<string, Sku>> {
    const data = await this.raw.fetchApplicationSkus(applicationId);
    const collection = new BaseCollection<string, Sku>();
    for (let raw of data) {
      const sku = new Sku(this.client, raw);
      collection.set(sku.id, sku);
    }
    return collection;
  }

  async fetchGuildSoundboardSound(
    guildId: string,
    soundId: string,
  ): Promise<SoundboardSound> {
    const data = await this.raw.fetchGuildSoundboardSound(guildId, soundId);
    return this._mergeSoundboardSound(guildId, data);
  }

  async fetchGuildSoundboardSounds(
    guildId: string,
  ): Promise<BaseCollection<string, SoundboardSound>> {
    const data = await this.raw.fetchGuildSoundboardSounds(guildId);

    // this is the full list, so replace the guild's cache with it
    if (this.client.soundboardSounds.enabled && this.client.guilds.has(guildId)) {
      const guild = this.client.guilds.get(guildId)!;
      guild.merge({[DiscordKeys.SOUNDBOARD_SOUNDS]: data.items});
      return guild.soundboardSounds;
    }

    const collection = new BaseCollection<string, SoundboardSound>();
    for (let raw of data.items) {
      raw[DiscordKeys.GUILD_ID] = guildId;
      const sound = new SoundboardSound(this.client, raw);
      collection.set(sound.soundId, sound);
    }
    return collection;
  }

  fetchLobby(
    lobbyId: string,
  ) {
    return this.raw.fetchLobby(lobbyId);
  }

  fetchLobbyMessages(
    lobbyId: string,
    options: RequestTypes.FetchLobbyMessages = {},
  ) {
    return this.raw.fetchLobbyMessages(lobbyId, options);
  }

  async fetchSoundboardDefaultSounds(): Promise<BaseCollection<string, SoundboardSound>> {
    const data = await this.raw.fetchSoundboardDefaultSounds();
    const collection = new BaseCollection<string, SoundboardSound>();
    for (let raw of data) {
      const sound = new SoundboardSound(this.client, raw);
      collection.set(sound.soundId, sound);
    }
    return collection;
  }

  leaveLobby(
    lobbyId: string,
  ) {
    return this.raw.leaveLobby(lobbyId);
  }

  removeLobbyMember(
    lobbyId: string,
    userId: string,
  ) {
    return this.raw.removeLobbyMember(lobbyId, userId);
  }

  sendSoundboardSound(
    channelId: string,
    options: RequestTypes.SendSoundboardSound,
  ) {
    return this.raw.sendSoundboardSound(channelId, options);
  }

  async editMe(
    options: RequestTypes.EditMe = {},
    updateCache: boolean = true,
  ): Promise<UserMe> {
    const data = await this.raw.editMe(options);
    let user: UserMe;
    if (updateCache && this.client.user !== null) {
      user = this.client.user!;
      user.merge(data);
    } else {
      user = new UserMe(this.client, data);
    }
    return user;
  }

  editMeBillingPaymentSource(
    paymentSourceId: string,
    options: RequestTypes.EditMeBillingPaymentSource = {},
  ) {
    return this.raw.editMeBillingPaymentSource(paymentSourceId, options);
  }

  editMeBillingSubscription(
    subscriptionId: string,
    options: RequestTypes.EditMeBillingSubscription = {},
  ) {
    return this.raw.editMeBillingSubscription(subscriptionId, options);
  }

  async editMessage(
    channelId: string,
    messageId: string,
    options: RequestTypes.EditMessage | string = {},
    updateCache: boolean = true,
  ): Promise<Message> {
    const listenerData = createComponentListenerOrNone(options);
    if (listenerData && listenerData[2]) {
      if (typeof(options) === 'string') {
        options = {content: options};
      }
      options.flags = (options.flags || 0) | MessageFlags.IS_COMPONENTS_V2;
    }

    const data = await this.raw.editMessage(channelId, messageId, options);
    this.fillMessageGuildId(data);
    let message: Message;
    if (updateCache && this.client.messages.has(data.id)) {
      message = this.client.messages.get(data.id)!;
      message.merge(data);
      // should we really merge? the message_update event wont have differences then
    } else {
      message = new Message(this.client, data);
      if (updateCache) {
        this.client.messages.insert(message);
      }
    }

    if (listenerData) {
      const [lId, listener] = listenerData;

      const listenerId = lId || message.id;
      if (listener) {
        listener.id = listenerId;
        this.client.gatewayHandler._handlers.component.insert(listener);
      } else {
        this.client.gatewayHandler._handlers.component.delete(listenerId);
      }
    }

    return message;
  }

  editNote(
    userId: string,
    note: string,
  ) {
    return this.raw.editNote(userId, note);
  }

  editOauth2Application(
    applicationId: string,
    options: RequestTypes.EditOauth2Application = {},
  ) {
    return this.raw.editOauth2Application(applicationId, options);
  }

  editRelationship(
    userId: string,
    type: number,
  ) {
    return this.raw.editRelationship(userId, type);
  }

  editStageInstance(
    channelId: string,
    options: RequestTypes.EditStageInstance = {},
  ) {
    return this.raw.editStageInstance(channelId, options);
  }

  editSettings(
    options: RequestTypes.EditSettings = {},
  ) {
    return this.raw.editSettings(options);
  }

  async editTeam(
    teamId: string,
    options: RequestTypes.EditTeam = {},
  ) {
    return this.raw.editTeam(teamId, options);
  }

  async editUser(options: RequestTypes.EditMe = {}) {
    return this.editMe(options);
  }

  async editWebhook(
    webhookId: string,
    options: RequestTypes.EditWebhook = {},
  ): Promise<Webhook> {
    const data = await this.raw.editWebhook(webhookId, options);
    return new Webhook(this.client, data);
  }

  async editWebhookToken(
    webhookId: string,
    webhookToken: string,
    options: RequestTypes.EditWebhook = {},
  ): Promise<Webhook> {
    const data = await this.raw.editWebhookToken(webhookId, webhookToken, options);
    return new Webhook(this.client, data);
  }

  async editWebhookTokenMessage(
    webhookId: string,
    webhookToken: string,
    messageId: string,
    options: RequestTypes.EditWebhookTokenMessage = {},
    updateCache: boolean = true,
    guildId?: null | string,
  ): Promise<Message> {
    const listenerData = createComponentListenerOrNone(options);
    if (listenerData && listenerData[2]) {
      if (typeof(options) === 'string') {
        options = {content: options};
      }
      options.flags = (options.flags || 0) | MessageFlags.IS_COMPONENTS_V2;
    }

    const data = await this.raw.editWebhookTokenMessage(webhookId, webhookToken, messageId, options);
    this.fillMessageGuildId(data, guildId);

    let message: Message;
    if (updateCache && this.client.messages.has(data.id)) {
      message = this.client.messages.get(data.id)!;
      message.merge(data);
    } else {
      message = new Message(this.client, data);
      if (updateCache) {
        this.client.messages.insert(message);
      }
    }

    const responseInteractionId = getResponseInteractionId(message);
    if (responseInteractionId) {
      this.client.gatewayHandler._handlers.component.replaceId(responseInteractionId, message.id);
    }

    if (listenerData) {
      const [lId, listener] = listenerData;

      const listenerId = lId || message.id;
      if (listener) {
        listener.id = listenerId;
        this.client.gatewayHandler._handlers.component.insert(listener);
      } else {
        this.client.gatewayHandler._handlers.component.delete(listenerId);
      }
    }

    return message;
  }

  enableOauth2ApplicationRpc(
    applicationId: string,
  ) {
    return this.raw.enableOauth2ApplicationRpc(applicationId);
  }

  endChannelPoll(
    channelId: string,
    messageId: string,
  ) {
    return this.raw.endChannelPoll(channelId, messageId);
  }

  async executeWebhook(
    webhookId: string,
    webhookToken: string,
    options: RequestTypes.ExecuteWebhook | string = {},
    compatibleType?: string,
    guildId?: null | string,
  ): Promise<Message | null> {
    const listenerData = createComponentListenerOrNone(options);
    if (listenerData && listenerData[2]) {
      if (typeof(options) === 'string') {
        options = {content: options};
      }
      options.flags = (options.flags || 0) | MessageFlags.IS_COMPONENTS_V2;
    }
    if (listenerData && listenerData[1] && listenerData[1].hasRun && !listenerData[0] && typeof(options) === 'object') {
      // the listener is keyed by the message id, without `wait` discord doesn't send the message back so it could never be matched
      options = Object.assign({}, options, {wait: true});
    }

    const data = await this.raw.executeWebhook(webhookId, webhookToken, options, compatibleType);
    if (data) {
      this.fillMessageGuildId(data, guildId);
      const message = new Message(this.client, data);
      this.client.messages.insert(message);

      if (listenerData) {
        const [lId, listener] = listenerData;
  
        const listenerId = lId || message.id;
        if (listener) {
          listener.id = listenerId;
          this.client.gatewayHandler._handlers.component.insert(listener);
        } else {
          this.client.gatewayHandler._handlers.component.delete(listenerId);
        }
      }

      return message;
    }

    if (listenerData) {
      const [ lId, listener ] = listenerData;

      // only a custom listener id can be matched without the message
      if (listener && lId) {
        listener.id = lId;
        this.client.gatewayHandler._handlers.component.insert(listener);
      }
    }

    return data;
  }

  fetchActivities() {
    return this.raw.fetchActivities();
  }

  async fetchApplicationCommands(
    applicationId: string,
    options: RequestTypes.FetchApplicationCommands = {},
  ): Promise<BaseCollection<string, ApplicationCommand>> {
    const data = await this.raw.fetchApplicationCommands(applicationId, options);
    const collection = new BaseCollection<string, ApplicationCommand>();

    for (let raw of data) {
      const command = new ApplicationCommand(this.client, raw);
      collection.set(command.id, command);
    }
    return collection;
  }

  async fetchApplicationCommand(
    applicationId: string,
    commandId: string,
  ): Promise<ApplicationCommand>{
    const data = await this.raw.fetchApplicationCommand(applicationId, commandId);
    return new ApplicationCommand(this.client, data);
  }

  async fetchApplicationEmojis(
    applicationId: string,
  ): Promise<{items: BaseCollection<string, Emoji>}>{
    const data = await this.raw.fetchApplicationEmojis(applicationId);
    const collection = new BaseCollection<string, Emoji>();

    const isOwnApplication = this._isOwnApplication(applicationId);
    for (let raw of data.items) {
      let emoji: Emoji;
      if (isOwnApplication && this.client.applicationEmojis.has(raw.id)) {
        emoji = this.client.applicationEmojis.get(raw.id)!;
        emoji.merge(raw);
      } else {
        emoji = new Emoji(this.client, raw);
      }
      collection.set(emoji.id!, emoji);
    }

    // this is the full list, so replace the cache with it
    if (isOwnApplication && this.client.applicationEmojis.enabled) {
      this.client.applicationEmojis.clear();
      for (let [emojiId, emoji] of collection) {
        this.client.applicationEmojis.insert(emoji);
      }
    }
    return {items: collection};
  }

  async fetchApplicationEmoji(
    applicationId: string,
    emojiId: string,
  ): Promise<Emoji>{
    const data = await this.raw.fetchApplicationEmoji(applicationId, emojiId);

    let emoji: Emoji;
    if (this._isOwnApplication(applicationId) && this.client.applicationEmojis.has(data.id)) {
      emoji = this.client.applicationEmojis.get(data.id)!;
      emoji.merge(data);
    } else {
      emoji = new Emoji(this.client, data);
      if (this._isOwnApplication(applicationId)) {
        this.client.applicationEmojis.insert(emoji);
      }
    }
    return emoji;
  }

  _isOwnApplication(applicationId: string): boolean {
    return applicationId === '@me' || (this.client.isBot && applicationId === this.client.applicationId);
  }

  async fetchApplicationEntitlement(
    applicationId: string,
    entitlementId: string,
  ): Promise<Entitlement> {
    const data = await this.raw.fetchApplicationEntitlement(applicationId, entitlementId);
    return new Entitlement(this.client, data);
  }

  async fetchApplicationEntitlements(
    applicationId: string,
    options: RequestTypes.FetchApplicationEntitlements = {},
  ): Promise<BaseCollection<string, Entitlement>> {
    const data = await this.raw.fetchApplicationEntitlements(applicationId, options);
    const collection = new BaseCollection<string, Entitlement>();

    for (let raw of data) {
      const entitlement = new Entitlement(this.client, raw);
      collection.set(entitlement.id, entitlement);
    }
    return collection;
  }

  async fetchApplicationGuildCommands(
    applicationId: string,
    guildId: string,
    options: RequestTypes.FetchApplicationGuildCommands = {},
  ): Promise<BaseCollection<string, ApplicationCommand>> {
    const data = await this.raw.fetchApplicationGuildCommands(applicationId, guildId, options);
    const collection = new BaseCollection<string, ApplicationCommand>();

    for (let raw of data) {
      const command = new ApplicationCommand(this.client, raw);
      collection.set(command.id, command);
    }
    return collection;
  }

  async fetchApplicationGuildCommandsPermissions(
    applicationId: string,
    guildId: string,
  ): Promise<BaseCollection<string, ApplicationCommandPermissions>> {
    const data = await this.raw.fetchApplicationGuildCommandsPermissions(applicationId, guildId);
    const collection = new BaseCollection<string, ApplicationCommandPermissions>();

    for (let raw of data) {
      const commandPermissions = new ApplicationCommandPermissions(this.client, raw);
      collection.set(commandPermissions.id, commandPermissions);
    }
    return collection;
  }

  async fetchApplicationGuildCommand(
    applicationId: string,
    guildId: string,
    commandId: string,
  ): Promise<ApplicationCommand> {
    const data = await this.raw.fetchApplicationGuildCommand(applicationId, guildId, commandId);
    return new ApplicationCommand(this.client, data);
  }

  async fetchApplicationGuildCommandPermissions(
    applicationId: string,
    guildId: string,
    commandId: string,
  ): Promise<ApplicationCommandPermissions> {
    const data = await this.raw.fetchApplicationGuildCommandPermissions(applicationId, guildId, commandId);
    return new ApplicationCommandPermissions(this.client, data);
  }

  async fetchApplicationNews(
    applicationIds?: Array<string> | string,
  ): Promise<BaseCollection<string, ApplicationNews>> {
    const data = await this.raw.fetchApplicationNews(applicationIds);
    const collection = new BaseCollection<string, ApplicationNews>();
    for (let raw of data) {
      const applicationNews = new ApplicationNews(this.client, raw);
      collection.set(applicationNews.id, applicationNews);
    }
    return collection;
  }

  async fetchApplicationNewsId(newsId: string): Promise<ApplicationNews> {
    const data = await this.raw.fetchApplicationNewsId(newsId);
    return new ApplicationNews(this.client, data);
  }

  fetchApplications() {
    return this.raw.fetchApplications();
  }

  async fetchApplication(
    applicationId: string,
  ): Promise<Application> {
    const data = await this.raw.fetchApplication(applicationId);
    return new Application(this.client, data);
  }

  async fetchApplicationActivityInstance(
    applicationId: string,
    instanceId: string,
  ): Promise<ApplicationActivityInstance> {
    const data = await this.raw.fetchApplicationActivityInstance(applicationId, instanceId);
    return new ApplicationActivityInstance(this.client, data);
  }

  async fetchApplicationRoleConnectionsMetadata(
    applicationId: string,
  ): Promise<BaseCollection<string, ApplicationRoleConnectionMetadata>> {
    const data = await this.raw.fetchApplicationRoleConnectionsMetadata(applicationId);
    const collection = new BaseCollection<string, ApplicationRoleConnectionMetadata>();
    for (let raw of data) {
      const record = new ApplicationRoleConnectionMetadata(this.client, raw);
      collection.set(record.key, record);
    }
    return collection;
  }

  async fetchApplicationsDetectable(): Promise<BaseCollection<string, Application>> {
    const data = await this.raw.fetchApplicationsDetectable.call(this);
    const collection = new BaseCollection<string, Application>();
    for (let raw of data) {
      const application = new Application(this.client, raw);
      collection.set(application.id, application);
    }
    return collection;
  }

  fetchApplicationsPublic(
    applicationIds: string | Array<string>,
  ) {
    return this.raw.fetchApplicationsPublic(applicationIds);
  }

  fetchApplicationsTrendingGlobal() {
    return this.raw.fetchApplicationsTrendingGlobal();
  }

  fetchAuthConsentRequired() {
    return this.raw.fetchAuthConsentRequired();
  }

  async fetchChannel(channelId: string, updateCache: boolean = true): Promise<Channel> {
    const data = await this.raw.fetchChannel(channelId);
    let channel: Channel;
    if (updateCache && this.client.channels.has(data.id)) {
      channel = this.client.channels.get(data.id)!;
      channel.merge(data);
    } else {
      channel = createChannelFromData(this.client, data);
    }
    return channel;
  }

  fetchChannelCall(
    channelId: string,
  ) {
    return this.raw.fetchChannelCall(channelId);
  }

  async fetchChannelInvites(
    channelId: string,
  ): Promise<BaseCollection<string, Invite>> {
    const data: Array<any> = await this.raw.fetchChannelInvites(channelId);
    const collection = new BaseCollection<string, Invite>();
    for (let raw of data) {
      const invite = new Invite(this.client, raw);
      collection.set(invite.code, invite);
    }
    return collection;
  }

  async fetchChannelPollAnswerVoters(
    channelId: string,
    messageId: string,
    answerId: string,
    options: RequestTypes.FetchChannelPollAnswerVoters = {},
  ): Promise<BaseCollection<string, User>> {
    const data = await this.raw.fetchChannelPollAnswerVoters(channelId, messageId, answerId, options);
    const collection = new BaseCollection<string, User>();

    for (let raw of data) {
      let user: User;
      if (this.client.users.has(raw.id)) {
        user = this.client.users.get(raw.id)!;
        user.merge(raw);
      } else {
        user = new User(this.client, raw);
      }
      collection.set(user.id, user);
    }
    return collection;
  }

  async fetchChannelStoreListing(channelId: string): Promise<StoreListing> {
    const data = await this.raw.fetchChannelStoreListing(channelId);
    return new StoreListing(this.client, data);
  }

  async fetchChannelThreadsActive(
    channelId: string,
  ): Promise<RestResponses.FetchChannelThreadsActive> {
    // the raw client filters the guild's active threads (the channel route was removed in api v10)
    // pass the cached guild id so it doesn't have to fetch the channel first
    const channel = this.client.channels.get(channelId);
    const data = await this.raw.fetchChannelThreadsActive(channelId, {guildId: (channel && channel.guildId) || undefined});
    const hasMore = data['has_more'];
    const members = new BaseCollection<string, BaseCollection<string, ThreadMember>>();
    const threads = new BaseCollection<string, ChannelGuildThread>();

    for (let raw of data.members) {
      const threadMember = new ThreadMember(this.client, raw);

      let collection: BaseCollection<string, ThreadMember>;
      if (members.has(threadMember.id)) {
        collection = members.get(threadMember.id)!;
      } else {
        collection = new BaseCollection();
        members.set(threadMember.id, collection);
      }
      collection.set(threadMember.userId, threadMember);
    }

    for (let raw of data.threads) {
      const thread = createChannelFromData(this.client, raw) as ChannelGuildThread;
      threads.set(thread.id, thread);
    }

    return {hasMore, members, threads};
  }

  async fetchChannelThreadsArchivedPrivate(
    channelId: string,
    options: RequestTypes.FetchChannelThreadsArchivedPrivate = {},
  ): Promise<RestResponses.FetchChannelThreadsArchivedPrivate> {
    const data = await this.raw.fetchChannelThreadsArchivedPrivate(channelId, options);
    const hasMore = data['has_more'];
    const members = new BaseCollection<string, BaseCollection<string, ThreadMember>>();
    const threads = new BaseCollection<string, ChannelGuildThread>();

    for (let raw of data.members) {
      const threadMember = new ThreadMember(this.client, raw);

      let collection: BaseCollection<string, ThreadMember>;
      if (members.has(threadMember.id)) {
        collection = members.get(threadMember.id)!;
      } else {
        collection = new BaseCollection();
        members.set(threadMember.id, collection);
      }
      collection.set(threadMember.userId, threadMember);
    }

    for (let raw of data.threads) {
      const thread = createChannelFromData(this.client, raw) as ChannelGuildThread;
      threads.set(thread.id, thread);
    }

    return {hasMore, members, threads};
  }

  async fetchChannelThreadsArchivedPrivateJoined(
    channelId: string,
    options: RequestTypes.FetchChannelThreadsArchivedPrivateJoined = {},
  ): Promise<RestResponses.FetchChannelThreadsArchivedPrivateJoined> {
    const data = await this.raw.fetchChannelThreadsArchivedPrivateJoined(channelId, options);
    const hasMore = data['has_more'];
    const members = new BaseCollection<string, BaseCollection<string, ThreadMember>>();
    const threads = new BaseCollection<string, ChannelGuildThread>();

    for (let raw of data.members) {
      const threadMember = new ThreadMember(this.client, raw);

      let collection: BaseCollection<string, ThreadMember>;
      if (members.has(threadMember.id)) {
        collection = members.get(threadMember.id)!;
      } else {
        collection = new BaseCollection();
        members.set(threadMember.id, collection);
      }
      collection.set(threadMember.userId, threadMember);
    }

    for (let raw of data.threads) {
      const thread = createChannelFromData(this.client, raw) as ChannelGuildThread;
      threads.set(thread.id, thread);
    }

    return {hasMore, members, threads};
  }

  async fetchChannelThreadsArchivedPublic(
    channelId: string,
    options: RequestTypes.FetchChannelThreadsArchivedPublic = {},
  ): Promise<RestResponses.FetchChannelThreadsArchivedPublic> {
    const data = await this.raw.fetchChannelThreadsArchivedPublic(channelId, options);
    const hasMore = data['has_more'];
    const members = new BaseCollection<string, BaseCollection<string, ThreadMember>>();
    const threads = new BaseCollection<string, ChannelGuildThread>();

    for (let raw of data.members) {
      const threadMember = new ThreadMember(this.client, raw);

      let collection: BaseCollection<string, ThreadMember>;
      if (members.has(threadMember.id)) {
        collection = members.get(threadMember.id)!;
      } else {
        collection = new BaseCollection();
        members.set(threadMember.id, collection);
      }
      collection.set(threadMember.userId, threadMember);
    }

    for (let raw of data.threads) {
      const thread = createChannelFromData(this.client, raw) as ChannelGuildThread;
      threads.set(thread.id, thread);
    }

    return {hasMore, members, threads};
  }

  async fetchChannelWebhooks(
    channelId: string,
  ): Promise<BaseCollection<string, Webhook>> {
    const data = await this.raw.fetchChannelWebhooks(channelId);
    const collection = new BaseCollection<string, Webhook>();
    for (let raw of data) {
      const webhook = new Webhook(this.client, raw);
      collection.set(webhook.id, webhook);
    }
    return collection;
  }

  fetchConsentRequired() {
    return this.raw.fetchConsentRequired();
  }

  fetchConnectionAuthorizeUrl(
    platform: string,
    options: RequestTypes.FetchConnectionAuthorizeUrl = {},
  ) {
    return this.raw.fetchConnectionAuthorizeUrl(platform, options);
  }

  fetchDiscoverableGuilds() {
    return this.raw.fetchDiscoverableGuilds();
  }

  async fetchDms(
    userId: string = '@me',
    updateCache: boolean = true,
  ): Promise<BaseCollection<string, Channel>> {
    const data: Array<any> = await this.raw.fetchDms(userId);
    const collection = new BaseCollection<string, Channel>();
    for (let raw of data) {
      let channel: Channel;
      if (updateCache && this.client.channels.has(raw.id)) {
        channel = this.client.channels.get(raw.id)!;
        channel.merge(raw);
      } else {
        channel = createChannelFromData(this.client, raw);
      }
      collection.set(channel.id, channel);
    }
    return collection;
  }

  fetchExperiments(
    fingerprint?: string,
  ) {
    return this.raw.fetchExperiments(fingerprint);
  }

  fetchGateway() {
    return this.raw.fetchGateway();
  }

  fetchGatewayBot() {
    return this.raw.fetchGatewayBot();
  }

  async fetchGiftCode(
    code: string,
    options: RequestTypes.FetchGiftCode = {},
  ): Promise<Gift> {
    const data = await this.raw.fetchGiftCode(code, options);
    return new Gift(this.client, data);
  }

  async fetchGuild(
    guildId: string,
    options: RequestTypes.FetchGuild = {},
    updateCache: boolean = true,
  ): Promise<Guild> {
    const data = await this.raw.fetchGuild(guildId, options);

    let guild: Guild;
    if (updateCache && this.client.guilds.has(data.id)) {
      guild = this.client.guilds.get(data.id)!;
      guild.merge(data);
    } else {
      guild = new Guild(this.client, data, true);
    }
    guild.hasMetadata = true;
    return guild;
  }

  fetchGuildApplications(
    guildId: string,
    channelId?: string,
  ) {
    return this.raw.fetchGuildApplications(guildId, channelId);
  }

  async fetchGuildAuditLogs(
    guildId: string,
    options: RequestTypes.FetchGuildAuditLogs = {},
  ): Promise<BaseCollection<string, AuditLog>> {
    const data = await this.raw.fetchGuildAuditLogs(guildId, options);

    const applicationCommands = new BaseCollection<string, ApplicationCommand>();
    const autoModerationRules = new BaseCollection<string, AutoModerationRule>();
    const guildScheduledEvents = new BaseCollection<string, GuildScheduledEvent>();
    const integrations = new BaseCollection<string, Integration>();
    const threads = new BaseCollection<string, ChannelGuildThread>();
    const users = new BaseCollection<string, User>();
    const webhooks = new BaseCollection<string, Webhook>();

    for (let raw of data.application_commands) {
      const value = new ApplicationCommand(this.client, raw);
      applicationCommands.set(value.id, value);
    }
    for (let raw of data.auto_moderation_rules) {
      raw.guild_id = guildId;
      const value = new AutoModerationRule(this.client, raw);
      autoModerationRules.set(value.id, value);
    }
    for (let raw of data.guild_scheduled_events) {
      raw.guild_id = guildId;
      const value = new GuildScheduledEvent(this.client, raw);
      guildScheduledEvents.set(value.id, value);
    }
    for (let raw of data.integrations) {
      raw.guild_id = guildId;
      const value = new Integration(this.client, raw);
      integrations.set(value.id, value);
    }
    for (let raw of data.threads) {
      raw.guild_id = guildId;
      let value: ChannelGuildThread;
      if (this.client.channels.has(raw.id)) {
        value = this.client.channels.get(raw.id) as ChannelGuildThread;
      } else {
        value = new ChannelGuildThread(this.client, raw);
      }
      threads.set(value.id, value);
    }
    for (let raw of data.users) {
      let value: User;
      if (this.client.users.has(raw.id)) {
        value = this.client.users.get(raw.id)!;
        value.merge(raw);
      } else {
        value = new User(this.client, raw);
      }
      users.set(value.id, value);
    }
    for (let raw of data.webhooks) {
      const value = new Webhook(this.client, raw);
      webhooks.set(value.id, value);
    }

    const collection = new BaseCollection<string, AuditLog>();
    for (let raw of data.audit_log_entries) {
      let target: (
        ApplicationCommand | AutoModerationRule | GuildScheduledEvent |
        Integration | ChannelGuildThread | User |
        Webhook | undefined
      ) = undefined;
      if (applicationCommands.has(raw.target_id)) {
        target = applicationCommands.get(raw.target_id)!;
      } else if (autoModerationRules.has(raw.target_id)) {
        target = autoModerationRules.get(raw.target_id)!;
      } else if (guildScheduledEvents.has(raw.target_id)) {
        target = guildScheduledEvents.get(raw.target_id)!;
      } else if (integrations.has(raw.target_id)) {
        target = integrations.get(raw.target_id)!;
      } else if (threads.has(raw.target_id)) {
        target = threads.get(raw.target_id)!;
      } else if (users.has(raw.target_id)) {
        target = users.get(raw.target_id)!;
      } else if (webhooks.has(raw.target_id)) {
        target = webhooks.get(raw.target_id)!;
      }

      raw.guild_id = guildId;
      raw.target = target;
      if (raw.user_id) {
        raw.user = users.get(raw.user_id) || this.client.users.get(raw.user_id);
      }

      const auditLog = new AuditLog(this.client, raw);
      collection.set(auditLog.id, auditLog);
    }
    return collection;
  }

  async fetchGuildAutoModerationRule(
    guildId: string,
    autoModerationRuleId: string,
  ): Promise<AutoModerationRule> {
    const data = await this.raw.fetchGuildAutoModerationRule(guildId, autoModerationRuleId);
    data[DiscordKeys.GUILD_ID] = guildId;
    return new AutoModerationRule(this.client, data);
  }

  async fetchGuildAutoModerationRules(
    guildId: string,
  ): Promise<BaseCollection<string, AutoModerationRule>> {
    const data = await this.raw.fetchGuildAutoModerationRules(guildId);

    // this is the full list, so replace the guild's cache with it
    const guild = this.client.guilds.get(guildId);
    const shouldCache = !!guild && this.client.autoModerationRules.enabled;

    const collection = (shouldCache) ? guild!.autoModerationRules : new BaseCollection<string, AutoModerationRule>();
    if (shouldCache) {
      collection.clear();
    }
    for (let raw of data) {
      raw[DiscordKeys.GUILD_ID] = guildId;

      const rule = new AutoModerationRule(this.client, raw);
      collection.set(rule.id, rule);
    }
    return collection;
  }

  async fetchGuildBan(
    guildId: string,
    userId: string,
  ): Promise<GuildBan> {
    const data = await this.raw.fetchGuildBan(guildId, userId);
    data[DiscordKeys.GUILD_ID] = guildId;
    return new GuildBan(this.client, data);
  }

  async fetchGuildBans(
    guildId: string,
    options: RequestTypes.FetchGuildBans = {},
  ): Promise<BaseCollection<string, GuildBan>> {
    const data = await this.raw.fetchGuildBans(guildId, options);

    const collection = new BaseCollection<string, GuildBan>();
    for (let raw of data) {
      raw[DiscordKeys.GUILD_ID] = guildId;

      const ban = new GuildBan(this.client, raw);
      collection.set(ban.user.id, ban);
    }
    return collection;
  }

  async fetchGuildChannels(
    guildId: string,
  ): Promise<BaseCollection<string, Channel>> {
    const data = await this.raw.fetchGuildChannels(guildId);
    const collection = new BaseCollection<string, Channel>();

    for (let raw of data) {
      let channel: Channel;
      if (this.client.channels.has(raw.id)) {
        channel = this.client.channels.get(raw.id)!;
        channel.merge(raw);
      } else {
        channel = createChannelFromData(this.client, raw);
      }
      collection.set(channel.id, channel);
    }
    return collection;
  }

  async fetchGuildEmojis(
    guildId: string,
  ): Promise<BaseCollection<string, Emoji>> {
    const data = await this.raw.fetchGuildEmojis(guildId);

    if (this.client.emojis.enabled && this.client.guilds.has(guildId)) {
      const guild = this.client.guilds.get(guildId)!;
      guild.merge({emojis: data});
      return guild.emojis;
    } else {
      const collection = new BaseCollection<string, Emoji>();
      for (let raw of data) {
        let emoji: Emoji;
        if (this.client.emojis.has(guildId, raw.id)) {
          emoji = this.client.emojis.get(guildId, raw.id)!;
          emoji.merge(raw);
        } else {
          raw.guild_id = guildId;
          emoji = new Emoji(this.client, raw);
        }
        collection.set(emoji.id || emoji.name || '', emoji);
      }
      return collection;
    }
  }

  async fetchGuildEmoji(
    guildId: string,
    emojiId: string,
  ): Promise<Emoji> {
    const data = await this.raw.fetchGuildEmoji(guildId, emojiId);

    let emoji: Emoji;
    if (this.client.emojis.has(guildId, data.id)) {
      emoji = this.client.emojis.get(guildId, data.id)!;
      emoji.merge(data);
    } else {
      data.guild_id = guildId;
      emoji = new Emoji(this.client, data);
    }
    return emoji;
  }

  async fetchGuildIntegrations(
    guildId: string,
  ): Promise<BaseCollection<string, Integration>> {
    const data = await this.raw.fetchGuildIntegrations(guildId);
    const collection = new BaseCollection<string, Integration>();

    for (let raw of data) {
      raw.guild_id = guildId;
      const integration = new Integration(this.client, raw);
      collection.set(integration.id, integration);
    }
    return collection;
  }

  async fetchGuildInvites(
    guildId: string,
  ): Promise<BaseCollection<string, Invite>> {
    const data = await this.raw.fetchGuildInvites(guildId);
    const collection = new BaseCollection<string, Invite>();

    for (let raw of data) {
      const invite = new Invite(this.client, raw);
      collection.set(invite.code, invite);
    }
    return collection;
  }

  async fetchGuildMember(
    guildId: string,
    userId: string,
  ): Promise<Member> {
    const data = await this.raw.fetchGuildMember(guildId, userId);
    let member: Member;
    if (this.client.members.has(guildId, userId)) {
      member = this.client.members.get(guildId, userId)!;
      member.merge(data);
    } else {
      data.guild_id = guildId;
      member = new Member(this.client, data);
      this.client.members.insert(member);
    }
    return member;
  }

  async fetchGuildMembers(
    guildId: string,
    options: RequestTypes.FetchGuildMembers = {},
  ): Promise<BaseCollection<string, Member>> {
    const data = await this.raw.fetchGuildMembers(guildId, options);
    const collection = new BaseCollection<string, Member>();

    for (let raw of data) {
      let member: Member;
      if (this.client.members.has(guildId, raw.user.id)) {
        member = this.client.members.get(guildId, raw.user.id)!;
        member.merge(raw);
      } else {
        raw.guild_id = guildId;
        member = new Member(this.client, raw);
        this.client.members.insert(member);
      }
      collection.set(member.id, member);
    }
    return collection;
  }

  async fetchGuildMembersSearch(
    guildId: string,
    options: RequestTypes.FetchGuildMembersSearch,
  ): Promise<BaseCollection<string, Member>> {
    const data = await this.raw.fetchGuildMembersSearch(guildId, options);
    const collection = new BaseCollection<string, Member>();

    for (let raw of data) {
      let member: Member;
      if (this.client.members.has(guildId, raw.user.id)) {
        member = this.client.members.get(guildId, raw.user.id)!;
        member.merge(raw);
      } else {
        raw.guild_id = guildId;
        member = new Member(this.client, raw);
        this.client.members.insert(member);
      }
      collection.set(member.id, member);
    }
    return collection;
  }

  fetchGuildMemberVerification(
    guildId: string,
  ) {
    return this.raw.fetchGuildMemberVerification(guildId);
  }

  async fetchGuildPremiumSubscriptions(
    guildId: string,
  ): Promise<BaseCollection<string, PremiumSubscription>> {
    const data = await this.raw.fetchGuildPremiumSubscriptions(guildId);
    const subscriptions = new BaseCollection<string, PremiumSubscription>();
    for (let raw of data) {
      const subscription = new PremiumSubscription(this.client, raw);
      subscriptions.set(subscription.id, subscription);
    }
    return subscriptions;
  }

  fetchGuildPreview(
    guildId: string,
  ) {
    return this.raw.fetchGuildPreview(guildId);
  }

  fetchGuildPruneCount(
    guildId: string,
    options: RequestTypes.FetchGuildPruneCount = {},
  ) {
    return this.raw.fetchGuildPruneCount(guildId, options);
  }

  async fetchGuildRole(
    guildId: string,
    roleId: string,
  ): Promise<Role> {
    const data = await this.raw.fetchGuildRole(guildId, roleId);

    let role: Role;
    if (this.client.guilds.has(guildId) && this.client.guilds.get(guildId)!.roles.has(roleId)) {
      role = this.client.guilds.get(guildId)!.roles.get(roleId)!;
      role.merge(data);
    } else {
      data.guild_id = guildId;
      role = new Role(this.client, data);
    }
    return role;
  }

  // role id to member count, @everyone isn't included
  fetchGuildRoleMemberCounts(
    guildId: string,
  ): Promise<Record<string, number>> {
    return this.raw.fetchGuildRoleMemberCounts(guildId);
  }

  async fetchGuildThreadsActive(
    guildId: string,
  ): Promise<{members: BaseCollection<string, ThreadMember>, threads: BaseCollection<string, ChannelGuildThread>}> {
    const data = await this.raw.fetchGuildThreadsActive(guildId);

    const members = new BaseCollection<string, ThreadMember>();
    for (let raw of data.members) {
      const member = new ThreadMember(this.client, raw);
      members.set(member.id, member);
    }

    const threads = new BaseCollection<string, ChannelGuildThread>();
    for (let raw of data.threads) {
      let thread: ChannelGuildThread;
      if (this.client.channels.has(raw.id)) {
        thread = this.client.channels.get(raw.id) as ChannelGuildThread;
        thread.merge(raw);
      } else {
        raw.guild_id = guildId;
        thread = new ChannelGuildThread(this.client, raw);
      }
      threads.set(thread.id, thread);
    }
    return {members, threads};
  }

  fetchGuildOnboarding(
    guildId: string,
  ) {
    return this.raw.fetchGuildOnboarding(guildId);
  }

  editGuildOnboarding(
    guildId: string,
    options: RequestTypes.EditGuildOnboarding = {},
  ) {
    return this.raw.editGuildOnboarding(guildId, options);
  }

  fetchGuildWelcomeScreen(
    guildId: string,
  ) {
    return this.raw.fetchGuildWelcomeScreen(guildId);
  }

  editGuildWelcomeScreen(
    guildId: string,
    options: RequestTypes.EditGuildWelcomeScreen = {},
  ) {
    return this.raw.editGuildWelcomeScreen(guildId, options);
  }

  editGuildIncidentActions(
    guildId: string,
    options: RequestTypes.EditGuildIncidentActions = {},
  ) {
    return this.raw.editGuildIncidentActions(guildId, options);
  }

  async fetchGuildRoles(
    guildId: string,
  ): Promise<BaseCollection<string, Role>> {
    const data = await this.raw.fetchGuildRoles(guildId);
    const collection = new BaseCollection<string, Role>();

    if (this.client.guilds.has(guildId)) {
      const guild = this.client.guilds.get(guildId)!;
      for (let [roleId, role] of guild.roles) {
        if (!data.some((r: Role) => r.id === roleId)) {
          guild.roles.delete(roleId);
        }
      }

      for (let raw of data) {
        let role: Role;
        if (guild.roles.has(raw.id)) {
          role = guild.roles.get(raw.id)!;
          role.merge(raw);
        } else {
          raw.guild_id = guildId;
          role = new Role(this.client, raw);
          guild.roles.set(role.id, role);
        }
        collection.set(role.id, role);
      }
    } else {
      for (let raw of data) {
        raw.guild_id = guildId;
        const role = new Role(this.client, raw);
        collection.set(role.id, role);
      }
    }
    return collection;
  }

  async fetchGuildScheduledEvent(
    guildId: string,
    scheduledEventId: string,
    options: RequestTypes.FetchGuildScheduledEvent = {},
  ): Promise<GuildScheduledEvent> {
    const data = await this.raw.fetchGuildScheduledEvent(guildId, scheduledEventId, options);
    data[DiscordKeys.GUILD_ID] = guildId;
    return new GuildScheduledEvent(this.client, data);
  }

  async fetchGuildScheduledEvents(
    guildId: string,
    options: RequestTypes.FetchGuildScheduledEvents = {},
  ): Promise<BaseCollection<string, GuildScheduledEvent>> {
    const data = await this.raw.fetchGuildScheduledEvents(guildId, options);
    const collection = new BaseCollection<string, GuildScheduledEvent>();

    for (let raw of data) {
      raw[DiscordKeys.GUILD_ID] = guildId;

      const rule = new GuildScheduledEvent(this.client, raw);
      collection.set(rule.id, rule);
    }

    return collection;
  }

  async fetchGuildScheduledEventUsers(
    guildId: string,
    scheduledEventId: string,
    options: RequestTypes.FetchGuildScheduledEventUsers = {},
  ): Promise<BaseCollection<string, GuildScheduledEventUser>> {
    const data = await this.raw.fetchGuildScheduledEventUsers(guildId, scheduledEventId, options);
    const collection = new BaseCollection<string, GuildScheduledEventUser>();
  
    for (let raw of data) {
      if (raw[DiscordKeys.MEMBER]) {
        raw[DiscordKeys.MEMBER][DiscordKeys.GUILD_ID] = guildId;
      }
      const user = new GuildScheduledEventUser(this.client, raw);
      collection.set(user.id, user);
    }
  
    return collection;
  }

  async fetchGuildSticker(
    guildId: string,
    stickerId: string,
  ): Promise<Sticker> {
    const data = await this.raw.fetchGuildSticker(guildId, stickerId);

    let sticker: Sticker;
    if (this.client.stickers.has(guildId, stickerId)) {
      sticker = this.client.stickers.get(guildId, stickerId)!;
      sticker.merge(data);
    } else {
      sticker = new Sticker(this.client, data);
    }
    return sticker;
  }

  async fetchGuildStickers(
    guildId: string,
  ): Promise<BaseCollection<string, Sticker>> {
    const data = await this.raw.fetchGuildStickers(guildId);

    // guild.merge drops stickers when the sticker cache is off
    if (this.client.stickers.enabled && this.client.guilds.has(guildId)) {
      const guild = this.client.guilds.get(guildId)!;
      guild.merge({stickers: data});
      return guild.stickers;
    } else {
      const collection = new BaseCollection<string, Sticker>();
      for (let raw of data) {
        let sticker: Sticker;
        if (this.client.stickers.has(guildId, raw.id)) {
          sticker = this.client.stickers.get(guildId, raw.id)!;
          sticker.merge(raw);
        } else {
          sticker = new Sticker(this.client, raw);
        }
        collection.set(sticker.id, sticker);
      }
      return collection;
    }
  }

  async fetchGuildTemplates(
    guildId: string,
  ): Promise<BaseCollection<string, Template>> {
    const data = await this.raw.fetchGuildTemplates(guildId);
    const collection = new BaseCollection<string, Template>();

    for (let raw of data) {
      const template = new Template(this.client, raw);
      collection.set(template.code, template);
    }
    return collection;
  }

  fetchGuildVanityUrl(
    guildId: string,
  ) {
    return this.raw.fetchGuildVanityUrl(guildId);
  }

  async fetchGuildWebhooks(
    guildId: string,
  ): Promise<BaseCollection<string, Webhook>> {
    const data = await this.raw.fetchGuildWebhooks(guildId);
    const collection = new BaseCollection<string, Webhook>();

    for (let raw of data) {
      const webhook = new Webhook(this.client, raw);
      collection.set(webhook.id, webhook);
    }
    return collection;
  }

  fetchGuildWidget(
    guildId: string,
  ) {
    return this.raw.fetchGuildWidget(guildId);
  }

  fetchGuildWidgetJson(
    guildId: string,
  ) {
    return this.raw.fetchGuildWidgetJson(guildId);
  }

  fetchGuildWidgetPng(
    guildId: string,
    options: RequestTypes.FetchGuildWidgetPng = {},
  ) {
    return this.raw.fetchGuildWidgetPng(guildId, options);
  }

  editInviteTargetUsers(
    code: string,
    options: RequestTypes.EditInviteTargetUsers,
  ) {
    return this.raw.editInviteTargetUsers(code, options);
  }

  fetchInviteTargetUsers(
    code: string,
  ) {
    return this.raw.fetchInviteTargetUsers(code);
  }

  fetchInviteTargetUsersJobStatus(
    code: string,
  ) {
    return this.raw.fetchInviteTargetUsersJobStatus(code);
  }

  async fetchInvite(
    code: string,
    options: RequestTypes.FetchInvite = {},
  ): Promise<Invite> {
    const data = await this.raw.fetchInvite(code, options);
    return new Invite(this.client, data);
  }

  async fetchMe(options: RequestTypes.FetchMe = {}): Promise<UserMe> {
    const data = await this.raw.fetchMe.call(this, options);
    return new UserMe(this.client, data);
  }

  fetchMeBillingPaymentSources() {
    return this.raw.fetchMeBillingPaymentSources();
  }

  fetchMeBillingPayments(
    options: RequestTypes.FetchMeBillingPayments = {},
  ) {
    return this.raw.fetchMeBillingPayments(options);
  }

  fetchMeBillingSubscriptions() {
    return this.raw.fetchMeBillingSubscriptions();
  }

  async fetchMeChannels(): Promise<BaseCollection<string, Channel>> {
    const data = await this.raw.fetchMeChannels();
    const collection = new BaseCollection<string, Channel>();

    for (let raw of data) {
      let channel: Channel;
      if (this.client.channels.has(raw.id)) {
        channel = this.client.channels.get(raw.id)!;
        channel.merge(raw);
      } else {
        channel = createChannelFromData(this.client, raw);
      }
      collection.set(channel.id, channel);
    }
    return collection;
  }

  async fetchMeConnections(): Promise<BaseCollection<string, ConnectedAccount>> {
    const data = await this.raw.fetchMeConnections.call(this);
    const collection = new BaseCollection<string, ConnectedAccount>();
    for (let raw of data) {
      const account = new ConnectedAccount(this.client, raw);
      collection.set(account.key, account);
    }
    return collection;
  }

  fetchMeConnectionAccessToken(
    platform: string,
    accountId: string,
  ) {
    return this.raw.fetchMeConnectionAccessToken(platform, accountId);
  }

  fetchMeConnectionSubreddits(
    accountId: string,
  ) {
    return this.raw.fetchMeConnectionSubreddits(accountId);
  }

  fetchMeFeedSettings(
    options: RequestTypes.FetchMeFeedSettings = {},
  ) {
    return this.raw.fetchMeFeedSettings(options);
  }

  async fetchMeGuilds(
    options: RequestTypes.FetchMeGuilds = {},
  ): Promise<BaseCollection<string, GuildMe>> {
    const data = await this.raw.fetchMeGuilds(options);
    const collection = new BaseCollection<string, GuildMe>();

    for (let raw of data) {
      const guild = new GuildMe(this.client, raw);
      collection.set(guild.id, guild);
    }
    return collection;
  }

  async fetchMessage(
    channelId: string,
    messageId: string,
  ): Promise<Message> {
    const data = await this.raw.fetchMessage(channelId, messageId);

    let guildId: string | undefined;
    if (this.client.channels.has(data.channel_id)) {
      const channel = this.client.channels.get(data.channel_id)!;
      if (channel.guildId) {
        guildId = channel.guildId;
      }
    }

    let message: Message;
    if (this.client.messages.has(data.id)) {
      message = this.client.messages.get(data.id)!;
      message.merge(data);
    } else {
      data.guild_id = guildId;
      message = new Message(this.client, data);
    }
    return message;
  }

  async fetchMessages(
    channelId: string,
    options: RequestTypes.FetchMessages = {},
  ): Promise<BaseCollection<string, Message>> {
    const data = await this.raw.fetchMessages(channelId, options);

    let guildId: string | undefined;
    if (data.length) {
      const raw = data[0];
      if (this.client.channels.has(raw.channel_id)) {
        const channel = this.client.channels.get(raw.channel_id)!;
        if (channel.guildId) {
          guildId = channel.guildId;
        }
      }
    }

    const collection = new BaseCollection<string, Message>();
    for (let raw of data) {
      let message: Message;
      if (this.client.messages.has(raw.id)) {
        message = this.client.messages.get(raw.id)!;
        message.merge(raw);
      } else {
        raw.guild_id = guildId;
        message = new Message(this.client, raw);
      }
      collection.set(message.id, message);
    }
    return collection;
  }

  async fetchOauth2Applications(): Promise<BaseCollection<string, Application>> {
    const data = await this.raw.fetchOauth2Applications.call(this);

    const collection = new BaseCollection<string, Application>();
    for (let raw of data) {
      const application = new Application(this.client, raw);
      collection.set(application.id, application);
    }
    return collection;
  }

  async fetchOauth2Application(
    userId: string = '@me',
  ): Promise<Application> {
    const data = await this.raw.fetchOauth2Application(userId);

    let application: Application;
    if (userId === '@me') {
      application = this.client._mergeOauth2Application(data);
    } else {
      application = new Application(this.client, data);
    }
    return application;
  }

  fetchOauth2ApplicationWhitelist(
    applicationId: string,
  ) {
    return this.raw.fetchOauth2ApplicationWhitelist(applicationId);
  }

  fetchOauth2Authorize(
    options: RequestTypes.FetchOauth2Authorize = {},
  ) {
    return this.raw.fetchOauth2Authorize(options);
  }

  fetchOauth2AuthorizeWebhookChannels(
    guildId: string,
  ) {
    return this.raw.fetchOauth2AuthorizeWebhookChannels(guildId);
  }

  fetchOauth2Tokens() {
    return this.raw.fetchOauth2Tokens();
  }

  fetchOauth2Token(
    tokenId: string,
  ) {
    return this.raw.fetchOauth2Token(tokenId);
  }

  async fetchChannelPins(
    channelId: string,
    options: RequestTypes.FetchChannelPins = {},
  ): Promise<{hasMore: boolean, items: Array<{message: Message, pinnedAt: Date}>}> {
    const data = await this.raw.fetchChannelPins(channelId, options);

    let guildId: null | string = null;
    if (this.client.channels.has(channelId)) {
      guildId = this.client.channels.get(channelId)!.guildId || null;
    }

    const items: Array<{message: Message, pinnedAt: Date}> = [];
    for (let raw of data.items) {
      let message: Message;
      if (this.client.messages.has(raw.message.id)) {
        message = this.client.messages.get(raw.message.id)!;
        message.merge(raw.message);
      } else {
        raw.message.guild_id = guildId;
        message = new Message(this.client, raw.message);
      }
      items.push({message, pinnedAt: new Date(raw.pinned_at)});
    }
    return {hasMore: !!data.has_more, items};
  }

  /** @deprecated use `fetchChannelPins` */
  async fetchPinnedMessages(
    channelId: string,
  ): Promise<BaseCollection<string, Message>> {
    const data = await this.raw.fetchPinnedMessages(channelId);

    let guildId: null | string = null;
    if (data.length) {
      const raw = data[0];
      if (this.client.channels.has(raw['channel_id'])) {
        const channel = this.client.channels.get(raw['channel_id'])!;
        guildId = channel.guildId || null;
      }
    }

    const collection = new BaseCollection<string, Message>();
    for (let raw of data) {
      let message: Message;
      if (this.client.messages.has(raw.id)) {
        message = this.client.messages.get(raw.id)!;
        message.merge(raw);
      } else {
        raw.guild_id = guildId;
        message = new Message(this.client, raw);
      }
      collection.set(message.id, message);
    }
    return collection;
  }

  async fetchReactions(
    channelId: string,
    messageId: string,
    emoji: string,
    options: RequestTypes.FetchReactions = {},
  ): Promise<BaseCollection<string, User>> {
    const data = await this.raw.fetchReactions(channelId, messageId, emoji, options);
    const collection = new BaseCollection<string, User>();
    for (let raw of data) {
      let user: User;
      if (this.client.users.has(raw.id)) {
        user = this.client.users.get(raw.id)!;
        user.merge(raw);
      } else {
        user = new User(this.client, raw);
      }
      collection.set(user.id, user);
    }
    return collection;
  }

  async fetchStageInstance(
    channelId: string,
  ): Promise<StageInstance> {
    const data = await this.raw.fetchStageInstance(channelId);
    return new StageInstance(this.client, data);
  }

  async fetchStoreApplicationAssets(
    applicationId: string,
  ): Promise<BaseCollection<string, StoreApplicationAsset>> {
    const data = await this.raw.fetchStoreApplicationAssets(applicationId);

    const collection = new BaseCollection<string, StoreApplicationAsset>();
    for (let raw of data) {
      raw.application_id = applicationId;
      const asset = new StoreApplicationAsset(this.client, raw);
      collection.set(asset.id, asset);
    }
    return collection;
  }

  fetchStorePublishedListingsSkus(
    applicationId: string,
  ) {
    return this.raw.fetchStorePublishedListingsSkus(applicationId);
  }

  fetchStorePublishedListingsSku(
    skuId: string,
  ) {
    return this.raw.fetchStorePublishedListingsSku(skuId);
  }

  fetchStorePublishedListingsSkuSubscriptionPlans(
    skuId: string,
  ) {
    return this.raw.fetchStorePublishedListingsSkuSubscriptionPlans(skuId);
  }

  fetchStreamPreview(
    streamKey: string,
  ) {
    return this.raw.fetchStreamPreview(streamKey);
  }

  async fetchTeams(): Promise<BaseCollection<string, Team>> {
    const data = await this.raw.fetchTeams();
    const collection = new BaseCollection<string, Team>();
    for (let raw of data) {
      const team = new Team(this.client, raw);
      collection.set(team.id, team);
    }
    return collection;
  }

  async fetchTeam(
    teamId: string,
  ): Promise<Team> {
    const data = await this.raw.fetchTeam(teamId);
    return new Team(this.client, data);
  }

  fetchTeamApplications(
    teamId: string,
  ) {
    return this.raw.fetchTeamApplications(teamId);
  }

  async fetchTeamMembers(teamId: string): Promise<BaseCollection<string, TeamMember>> {
    const data: Array<any> = await this.raw.fetchTeamMembers(teamId);
    const collection = new BaseCollection<string, TeamMember>();
    for (let raw of data) {
      collection.set(raw.user.id, new TeamMember(this.client, raw));
    }
    return collection;
  }

  async fetchTeamMember(teamId: string, userId: string): Promise<TeamMember> {
    const data = await this.raw.fetchTeamMember(teamId, userId);
    return new TeamMember(this.client, data);
  }

  fetchTeamPayouts(
    teamId: string,
    options: RequestTypes.FetchTeamPayouts = {},
  ) {
    return this.raw.fetchTeamPayouts(teamId, options);
  }

  async fetchTemplate(templateId: string): Promise<Template> {
    const data = await this.raw.fetchTemplate(templateId);
    return new Template(this.client, data);
  }

  async fetchThreadMember(
    channelId: string,
    userId: string,
    options: RequestTypes.FetchThreadMember = {},
  ): Promise<ThreadMember> {
    const data = await this.raw.fetchThreadMember(channelId, userId, options);
    return new ThreadMember(this.client, data);
  }

  async fetchThreadMembers(
    channelId: string,
    options: RequestTypes.FetchThreadMembers = {},
  ): Promise<BaseCollection<string, ThreadMember>> {
    const data = await this.raw.fetchThreadMembers(channelId, options);
    const collection = new BaseCollection<string, ThreadMember>();

    for (let raw of data) {
      const threadMember = new ThreadMember(this.client, raw);
      collection.set(threadMember.userId, threadMember);
    }
    return collection;
  }

  async fetchUser(
    userId: string,
  ): Promise<UserWithBanner> {
    const data = await this.raw.fetchUser(userId);
    if (this.client.users.has(data.id)) {
      this.client.users.get(data.id)!.merge(data);
    }
    return new UserWithBanner(this.client, data);
  }

  fetchUserActivityMetadata(
    userId: string,
    sessionId: string,
    activityId: string,
  ) {
    return this.raw.fetchUserActivityMetadata(userId, sessionId, activityId);
  }

  async fetchUserChannels(
    userId: string,
  ): Promise<BaseCollection<string, Channel>> {
    const data = await this.raw.fetchUserChannels(userId);
    const collection = new BaseCollection<string, Channel>();

    for (let raw of data) {
      let channel: Channel;
      if (this.client.channels.has(raw.id)) {
        channel = this.client.channels.get(raw.id)!;
        channel.merge(raw);
      } else {
        channel = createChannelFromData(this.client, raw);
      }
      collection.set(channel.id, channel);
    }
    return collection;
  }

  async fetchUserProfile(userId: string): Promise<Profile> {
    const data = await this.raw.fetchUserProfile(userId);
    return new Profile(this.client, data);
  }

  fetchVoiceIce() {
    return this.raw.fetchVoiceIce();
  }

  async fetchVoiceRegions(
    guildId?: string,
  ): Promise<BaseCollection<string, VoiceRegion>> {
    const data = await this.raw.fetchVoiceRegions(guildId);
    const regions = new BaseCollection<string, VoiceRegion>();
    for (let raw of data) {
      const region = new VoiceRegion(this.client, raw);
      regions.set(region.id, region);
    }
    return regions;
  }

  async fetchWebhook(
    webhookId: string,
  ): Promise<Webhook> {
    const data = await this.raw.fetchWebhook(webhookId);
    return new Webhook(this.client, data);
  }

  async fetchWebhookToken(
    webhookId: string,
    webhookToken: string,
  ): Promise<Webhook> {
    const data = await this.raw.fetchWebhookToken(webhookId, webhookToken);
    return new Webhook(this.client, data);
  }

  async fetchWebhookTokenMessage(
    webhookId: string,
    webhookToken: string,
    messageId: string,
    options: RequestTypes.FetchWebhookTokenMessage = {},
    guildId?: null | string,
  ): Promise<Message> {
    const data = await this.raw.fetchWebhookTokenMessage(webhookId, webhookToken, messageId, options);
    this.fillMessageGuildId(data, guildId);

    let message: Message;
    if (this.client.messages.has(data.id)) {
      message = this.client.messages.get(data.id)!;
      message.merge(data);
    } else {
      message = new Message(this.client, data);
    }

    const responseInteractionId = getResponseInteractionId(message);
    if (responseInteractionId && message.components.length) {
      this.client.gatewayHandler._handlers.component.replaceId(responseInteractionId, messageId);
    }

    return message;
  }

  async followChannel(
    channelId: string,
    options: RequestTypes.FollowChannel,
  ): Promise<{channelId: string, webhookId: string}> {
    const data = await this.raw.followChannel(channelId, options);
    return {channelId: data['channel_id'], webhookId: data['webhook_id']};
  }

  forgotPassword(
    options: RequestTypes.ForgotPassword,
  ) {
    return this.raw.forgotPassword(options);
  }

  integrationJoin(
    integrationId: string,
  ) {
    return this.raw.integrationJoin(integrationId);
  }

  joinGuild(
    guildId: string,
    options: RequestTypes.JoinGuild = {},
  ) {
    return this.raw.joinGuild(guildId, options);
  }

  joinThread(
    channelId: string,
  ) {
    return this.raw.joinThread(channelId);
  }

  leaveGuild(
    guildId: string,
  ) {
    return this.raw.leaveGuild(guildId);
  }

  leaveThread(
    channelId: string,
  ) {
    return this.raw.leaveThread(channelId);
  }

  login(
    options: RequestTypes.Login,
  ) {
    return this.raw.login(options);
  }

  loginMfaSms(
    options: RequestTypes.LoginMfaSms,
  ) {
    return this.raw.loginMfaSms(options);
  }

  loginMfaSmsSend(
    options: RequestTypes.LoginMfaSmsSend,
  ) {
    return this.raw.loginMfaSmsSend(options);
  }

  loginMfaTotp(
    options: RequestTypes.LoginMfaTotp,
  ) {
    return this.raw.loginMfaTotp(options);
  }

  logout(
    options: RequestTypes.Logout = {},
  ) {
    return this.raw.logout(options);
  }

  oauth2Authorize(
    options: RequestTypes.Oauth2Authorize = {},
  ) {
    return this.raw.oauth2Authorize(options);
  }

  redeemGiftCode(
    code: string,
    options: RequestTypes.RedeemGiftCode = {},
  ) {
    return this.raw.redeemGiftCode(code, options);
  }

  register(
    options: RequestTypes.Register,
  ) {
    return this.raw.register(options);
  }

  removeGuildBan(
    guildId: string,
    userId: string,
    options: RequestTypes.RemoveGuildBan = {},
  ) {
    return this.raw.removeGuildBan(guildId, userId, options);
  }

  removeGuildMember(
    guildId: string,
    userId: string,
    options: RequestTypes.RemoveGuildMember = {},
  ) {
    return this.raw.removeGuildMember(guildId, userId, options);
  }

  removeGuildMemberRole(
    guildId: string,
    userId: string,
    roleId: string,
    options: RequestTypes.RemoveGuildMemberRole = {},
  ) {
    return this.raw.removeGuildMemberRole(guildId, userId, roleId, options);
  }

  removeInviteTargetUser(
    code: string,
    userId: string,
  ) {
    return this.raw.removeInviteTargetUser(code, userId);
  }

  removeMention(
    messageId: string,
  ) {
    return this.raw.removeMention(messageId);
  }

  removeOauth2ApplicationWhitelistUser(
    applicationId: string,
    userId: string,
  ) {
    return this.raw.removeOauth2ApplicationWhitelistUser(applicationId, userId);
  }

  removeRecipient(
    channelId: string,
    userId: string,
  ) {
    return this.raw.removeRecipient(channelId, userId);
  }

  removeTeamMember(
    teamId: string,
    userId: string,
  ) {
    return this.raw.removeTeamMember(teamId, userId);
  }

  removeThreadMember(
    channelId: string,
    userId: string,
  ) {
    return this.raw.removeThreadMember(channelId, userId);
  }

  resetOauth2Application(
    applicationId: string,
  ) {
    return this.raw.resetOauth2Application(applicationId);
  }

  resetOauth2ApplicationBot(
    applicationId: string,
  ) {
    return this.raw.resetOauth2ApplicationBot(applicationId);
  }

  resetPassword(
    options: RequestTypes.ResetPassword,
  ) {
    return this.raw.resetPassword(options);
  }

  resetPasswordMfa(
    options: RequestTypes.ResetPasswordMfa,
  ) {
    return this.raw.resetPasswordMfa(options);
  }

  search(
    searchType: 'channel' | 'guild',
    searchId: string,
    options: RequestTypes.SearchOptions = {},
    retry: boolean = true,
    retryNumber: number = 0,
  ) {
    return this.raw.search(searchType, searchId, options, retry, retryNumber);
  }

  searchChannel(
    channelId: string,
    options: RequestTypes.SearchOptions = {},
    retry: boolean = true,
    retryNumber: number = 0,
  ) {
    return this.raw.searchChannel(channelId, options, retry, retryNumber);
  }

  searchGuild(
    guildId: string,
    options: RequestTypes.SearchOptions = {},
    retry: boolean = true,
    retryNumber: number = 0,
  ) {
    return this.raw.searchGuild(guildId, options, retry, retryNumber);
  }

  /** @deprecated old GameSDK lobbies, this endpoint doesn't exist anymore */
  searchLobbies(
    applicationId: string,
    options: RequestTypes.SearchLobbies = {},
  ) {
    return this.raw.searchLobbies(applicationId, options);
  }

  sendDownloadText(
    number: string,
  ) {
    return this.raw.sendDownloadText(number);
  }

  sendFriendRequest(
    options: RequestTypes.SendFriendRequest,
  ) {
    return this.raw.sendFriendRequest(options);
  }

  /** @deprecated old GameSDK lobbies, use `createLobbyMessage` */
  sendLobbyData(
    lobbyId: string,
    data: string,
  ) {
    return this.raw.sendLobbyData(lobbyId, data);
  }

  startChannelCallRinging(
    channelId: string,
    options: RequestTypes.StartChannelCallRinging = {},
  ) {
    return this.raw.startChannelCallRinging(channelId, options);
  }

  stopChannelCallRinging(
    channelId: string,
    options: RequestTypes.StopChannelCallRinging = {},
  ) {
    return this.raw.stopChannelCallRinging(channelId, options);
  }

  submitConnectionPinCode(
    platform: string,
    pin: string,
  ) {
    return this.raw.submitConnectionPinCode(platform, pin);
  }

  submitOauth2ApplicationApproval(
    applicationId: string,
  ) {
    return this.raw.submitOauth2ApplicationApproval(applicationId);
  }

  syncGuildIntegration(
    guildId: string,
    integrationId: string,
  ) {
    return this.raw.syncGuildIntegration(guildId, integrationId);
  }

  transferOauth2Application(
    applicationId: string,
    options: RequestTypes.TransferOauth2Application,
  ) {
    return this.raw.transferOauth2Application(applicationId, options);
  }

  triggerTyping(
    channelId: string,
  ) {
    return this.raw.triggerTyping(channelId);
  }

  unAckChannel(
    channelId: string,
  ) {
    return this.raw.unAckChannel(channelId);
  }

  verify(
    options: RequestTypes.Verify,
  ) {
    return this.raw.verify(options);
  }

  verifyCaptcha(
    options: RequestTypes.VerifyCaptcha,
  ) {
    return this.raw.verifyCaptcha(options);
  }

  verifyResend() {
    return this.raw.verifyResend();
  }
}
