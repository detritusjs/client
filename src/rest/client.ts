import {
  Client,
  ClientOptions,
  RequestTypes,
  RestClientEvents,
} from 'detritus-client-rest';
import { AuthTypes, RestEvents } from 'detritus-client-rest/lib/constants';

import { ShardClient } from '../client';
import { BaseCollection } from '../collections/basecollection';
import { ClientEvents } from '../constants';

import {
  Application,
  ApplicationCommand,
  ApplicationCommandPermissions,
  ApplicationNews,
  AuditLog,
  Channel,
  ChannelDM,
  ChannelDMGroup,
  ConnectedAccount,
  Emoji,
  Gift,
  Guild,
  GuildMe,
  Integration,
  Invite,
  Member,
  Message,
  Oauth2Application,
  Oauth2ApplicationAsset,
  PremiumSubscription,
  Profile,
  Role,
  StageInstance,
  StoreApplicationAsset,
  StoreListing,
  Team,
  TeamMember,
  Template,
  ThreadMember,
  User,
  UserMe,
  VoiceRegion,
  Webhook,
  createChannelFromData,
} from '../structures';

import { RestResponses } from './types';


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

  addPinnedMessage(
    channelId: string,
    messageId: string,
  ) {
    return this.raw.addPinnedMessage(channelId, messageId);
  }

  addRecipient(
    channelId: string,
    userId: string,
  ) {
    return this.raw.addRecipient(channelId, userId);
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

  bulkDeleteMessages(
    channelId: string,
    messageIds: Array<string>,
  ) {
    return this.raw.bulkDeleteMessages(channelId, messageIds);
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

  connectionCallback(
    platform: string,
    options: RequestTypes.ConnectionCallback,
  ) {
    return this.raw.connectionCallback(platform, options);
  }

  createApplicationCommand(
    applicationId: string,
    options: RequestTypes.CreateApplicationCommand,
  ) {
    return this.raw.createApplicationCommand(applicationId, options);
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

  async createChannelInvite(
    channelId: string,
    options: RequestTypes.CreateChannelInvite = {},
  ): Promise<Invite> {
    const data = await this.raw.createChannelInvite(channelId, options);
    return new Invite(this.client, data);
  }

  createChannelMessageThread(
    channelId: string,
    messageId: string,
    options: RequestTypes.CreateChannelMessageThread,
  ) {
    return this.raw.createChannelMessageThread(channelId, messageId, options);
  }

  createChannelStoreListingGrantEntitlement(
    channelId: string,
  ) {
    return this.raw.createChannelStoreListingGrantEntitlement(channelId);
  }

  createChannelThread(
    channelId: string,
    options: RequestTypes.CreateChannelThread,
  ) {
    return this.raw.createChannelThread(channelId, options);
  }

  async createDm(
    options: RequestTypes.CreateDm = {},
  ): Promise<ChannelDM | ChannelDMGroup> {
    const data = await this.raw.createDm(options);
    let channel: ChannelDM | ChannelDMGroup;
    if (this.client.channels.has(data.id)) {
      channel = this.client.channels.get(data.id) as ChannelDM | ChannelDMGroup;
      channel.merge(data);
      // this should never happen lmao
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

  createGuildBan(
    guildId: string,
    userId: string,
    options: RequestTypes.CreateGuildBan = {},
  ) {
    // make into object?
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
      // this should never happen lmao
    } else {
      channel = createChannelFromData(this.client, data);
      this.client.channels.insert(channel);
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
      this.client.emojis.insert(emoji);
    }
    return emoji;
  }

  createGuildIntegration(
    guildId: string,
    options: RequestTypes.CreateGuildIntegration,
  ) {
    // make this into object?
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

  createInteractionResponse(
    interactionId: string,
    token: string,
    options: RequestTypes.CreateInteractionResponse | number,
    data?: RequestTypes.CreateInteractionResponseInnerPayload | string,
  ) {
    return this.raw.createInteractionResponse(interactionId, token, options, data);
  }

  createLobby(
    applicationId: string,
    options: RequestTypes.CreateLobby = {},
  ) {
    return this.raw.createLobby(applicationId, options);
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

  async createMessage(
    channelId: string,
    options: RequestTypes.CreateMessage | string = {},
  ): Promise<Message> {
    const data = await this.raw.createMessage(channelId, options);
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

  createOauth2Application(
    options: RequestTypes.CreateOauth2Application,
  ) {
    return this.raw.createOauth2Application(options);
  }

  async createOauth2ApplicationAsset(
    applicationId: string,
    options: RequestTypes.CreateOauth2ApplicationAsset,
  ): Promise<Oauth2ApplicationAsset> {
    const data = await this.raw.createOauth2ApplicationAsset(applicationId, options);
    data.application_id = applicationId;
    return new Oauth2ApplicationAsset(this.client, data);
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
    // make this an object?
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

  deleteGuildTemplate(
    guildId: string,
    templateId: string,
  ) {
    return this.raw.deleteGuildTemplate(guildId, templateId);
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
    return data;
  }

  deleteOauth2Application(
    applicationId: string,
    options: RequestTypes.DeleteOauth2Application = {},
  ) {
    return this.raw.deleteOauth2Application(applicationId, options);
  }

  deleteOauth2ApplicationAsset(
    applicationId: string,
    assetId: string,
  ) {
    return this.raw.deleteOauth2ApplicationAsset(applicationId, assetId);
  }

  deletePinnedMessage(
    channelId: string,
    messageId: string,
  ) {
    return this.raw.deletePinnedMessage(channelId, messageId);
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
  ) {
    return this.raw.deleteStageInstance(channelId);
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
  ) {
    const data = await this.raw.deleteWebhookTokenMessage(webhookId, webhookToken, messageId);
    if (this.client.messages.has(messageId)) {
      const message = this.client.messages.get(messageId)!;
      message.deleted = true;
    }
    return data;
  }

  disableAccount(
    options: RequestTypes.DisableAccount,
  ) {
    return this.raw.disableAccount(options);
  }

  async editApplicationCommand(
    applicationId: string,
    commandId: string,
    options: RequestTypes.EditApplicationCommand = {},
  ): Promise<ApplicationCommand>{
    const data = await this.raw.editApplicationCommand(applicationId, commandId, options);
    return new ApplicationCommand(this.client, data);
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
      // insert? nah
    }
    return channel;
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

  editGuildChannels(
    guildId: string,
    channels: RequestTypes.EditGuildChannels,
    options: RequestTypes.EditGuildChannelsExtra = {},
  ) {
    return this.raw.editGuildChannels(guildId, channels, options);
  }

  editGuildEmbed(
    guildId: string,
    options: RequestTypes.EditGuildEmbed,
  ) {
    return this.raw.editGuildEmbed(guildId, options);
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

  editGuildMember(
    guildId: string,
    userId: string,
    options: RequestTypes.EditGuildMember = {},
  ) {
    return this.raw.editGuildMember(guildId, userId, options);
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

  editLobby(
    lobbyId: string,
    options: RequestTypes.EditLobby = {},
  ) {
    return this.raw.editLobby(lobbyId, options);
  }

  editLobbyMember(
    lobbyId: string,
    userId: string,
    options: RequestTypes.EditLobbyMember = {},
  ) {
    return this.raw.editLobbyMember(lobbyId, userId, options);
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
    const data = await this.raw.editMessage(channelId, messageId, options);
    let message: Message;
    if (updateCache && this.client.messages.has(data.id)) {
      message = this.client.messages.get(data.id)!;
      message.merge(data);
      // should we really merge? the message_update event wont have differences then
    } else {
      message = new Message(this.client, data);
      this.client.messages.insert(message);
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
  ): Promise<Message> {
    const data = await this.raw.editWebhookTokenMessage(webhookId, webhookToken, messageId, options);
    let message: Message;
    if (updateCache && this.client.messages.has(data.id)) {
      message = this.client.messages.get(data.id)!;
      message.merge(data);
    } else {
      message = new Message(this.client, data);
      this.client.messages.insert(message);
    }
    return message;
  }

  enableOauth2ApplicationAssets(
    applicationId: string,
  ) {
    return this.raw.enableOauth2ApplicationAssets(applicationId);
  }

  enableOauth2ApplicationRpc(
    applicationId: string,
  ) {
    return this.raw.enableOauth2ApplicationRpc(applicationId);
  }

  async executeWebhook(
    webhookId: string,
    webhookToken: string,
    options: RequestTypes.ExecuteWebhook | string = {},
    compatibleType?: string,
  ): Promise<Message | null> {
    const data = await this.raw.executeWebhook(webhookId, webhookToken, options, compatibleType);
    if (data) {
      const message = new Message(this.client, data);
      this.client.messages.insert(message);
      return message;
    }
    return data;
  }

  fetchActivities() {
    return this.raw.fetchActivities();
  }

  async fetchApplicationCommands(
    applicationId: string,
  ): Promise<BaseCollection<string, ApplicationCommand>> {
    const data = await this.raw.fetchApplicationCommands(applicationId);
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

  async fetchApplicationGuildCommands(
    applicationId: string,
    guildId: string,
  ): Promise<BaseCollection<string, ApplicationCommand>> {
    const data = await this.raw.fetchApplicationGuildCommands(applicationId, guildId);
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

  async fetchChannelStoreListing(channelId: string): Promise<StoreListing> {
    const data = await this.raw.fetchChannelStoreListing(channelId);
    return new StoreListing(this.client, data);
  }

  async fetchChannelThreadsActive(
    channelId: string,
  ): Promise<RestResponses.FetchChannelThreadsActive> {
    const data = await this.raw.fetchChannelThreadsActive(channelId);
    const hasMore = data['has_more'];
    const members = new BaseCollection<string, BaseCollection<string, ThreadMember>>();
    const threads = new BaseCollection<string, Channel>();

    for (let raw of data.members) {
      const threadMember = new ThreadMember(this.client, raw);

      let collection: BaseCollection<string, ThreadMember>;
      if (members.has(threadMember.id)) {
        collection = members.get(threadMember.id)!;
      } else {
        collection = new BaseCollection();
      }
      collection.set(threadMember.userId, threadMember);
    }

    for (let raw of data.threads) {
      const thread = createChannelFromData(this.client, raw);
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
    const threads = new BaseCollection<string, Channel>();

    for (let raw of data.members) {
      const threadMember = new ThreadMember(this.client, raw);

      let collection: BaseCollection<string, ThreadMember>;
      if (members.has(threadMember.id)) {
        collection = members.get(threadMember.id)!;
      } else {
        collection = new BaseCollection();
      }
      collection.set(threadMember.userId, threadMember);
    }

    for (let raw of data.threads) {
      const thread = createChannelFromData(this.client, raw);
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
    const threads = new BaseCollection<string, Channel>();

    for (let raw of data.members) {
      const threadMember = new ThreadMember(this.client, raw);

      let collection: BaseCollection<string, ThreadMember>;
      if (members.has(threadMember.id)) {
        collection = members.get(threadMember.id)!;
      } else {
        collection = new BaseCollection();
      }
      collection.set(threadMember.userId, threadMember);
    }

    for (let raw of data.threads) {
      const thread = createChannelFromData(this.client, raw);
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
    const threads = new BaseCollection<string, Channel>();

    for (let raw of data.members) {
      const threadMember = new ThreadMember(this.client, raw);

      let collection: BaseCollection<string, ThreadMember>;
      if (members.has(threadMember.id)) {
        collection = members.get(threadMember.id)!;
      } else {
        collection = new BaseCollection();
      }
      collection.set(threadMember.userId, threadMember);
    }

    for (let raw of data.threads) {
      const thread = createChannelFromData(this.client, raw);
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
  ) {
    return this.raw.fetchConnectionAuthorizeUrl(platform);
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
    const collection = new BaseCollection<string, AuditLog>();
    for (let raw of data.audit_log_entries) {
      let target: null | User | Webhook = null;
      if (this.client.users.has(raw.target_id)) {
        target = this.client.users.get(raw.target_id)!;
        // target.merge(data.users.find((user) => user.id === raw.target_id));
      } else {
        let rawTarget = data.users.find((user: any) => user.id === raw.target_id);
        if (rawTarget !== undefined) {
          target = new User(this.client, rawTarget);
        } else {
          rawTarget = data.webhooks.find((webhook: any) => webhook.id === raw.target_id);
          if (rawTarget !== undefined) {
            target = new Webhook(this.client, rawTarget);
          }
        }
      }

      let user: null | User = null;
      if (this.client.users.has(raw.user_id)) {
        user = this.client.users.get(raw.user_id)!;
      } else {
        const rawUser = data.users.find((u: any) => u.id === raw.user_id);
        if (rawUser !== undefined) {
          user = new User(this.client, rawUser);
        }
      }

      raw.guild_id = guildId;
      raw.target = target;
      raw.user = user;
      const auditLog = new AuditLog(this.client, raw);
      collection.set(auditLog.id, auditLog);
    }
    return collection;
  }

  async fetchGuildBans(
    guildId: string,
  ): Promise<RestResponses.FetchGuildBans> {
    const data = await this.raw.fetchGuildBans(guildId);
    const collection: RestResponses.FetchGuildBans = new BaseCollection();
    for (let raw of data) {
      let user: User;
      if (this.client.users.has(raw.user.id)) {
        user = this.client.users.get(raw.user.id)!;
        user.merge(raw.user);
      } else {
        user = new User(this.client, raw.user);
      }
      collection.set(user.id, {
        reason: raw.reason,
        user,
      });
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

  fetchGuildEmbed(
    guildId: string,
  ) {
    return this.raw.fetchGuildEmbed(guildId);
  }

  async fetchGuildEmojis(
    guildId: string,
  ): Promise<BaseCollection<string, Emoji>> {
    const data = await this.raw.fetchGuildEmojis(guildId);

    if (this.client.guilds.has(guildId)) {
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
        collection.set(emoji.id || emoji.name, emoji);
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

  async fetchMentions(
    options: RequestTypes.FetchMentions = {},
  ): Promise<BaseCollection<string, Message>> {
    const data = await this.raw.fetchMentions(options);

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

  async fetchOauth2Applications(): Promise<BaseCollection<string, Oauth2Application>> {
    const data = await this.raw.fetchOauth2Applications.call(this);

    const collection = new BaseCollection<string, Oauth2Application>();
    for (let raw of data) {
      const oauth2Application = new Oauth2Application(this.client, raw);
      collection.set(oauth2Application.id, oauth2Application);
    }
    return collection;
  }

  async fetchOauth2Application(
    userId: string = '@me',
  ): Promise<Oauth2Application> {
    const data = await this.raw.fetchOauth2Application(userId);

    let oauth2Application: Oauth2Application;
    if (userId === '@me') {
      oauth2Application = this.client._mergeOauth2Application(data);
    } else {
      oauth2Application = new Oauth2Application(this.client, data);
    }
    return oauth2Application;
  }

  async fetchOauth2ApplicationAssets(
    applicationId: string,
  ): Promise<BaseCollection<string, Oauth2ApplicationAsset>> {
    const data = await this.raw.fetchOauth2ApplicationAssets(applicationId);

    const collection = new BaseCollection<string, Oauth2ApplicationAsset>();
    for (let raw of data) {
      raw.application_id = applicationId;
      const asset = new Oauth2ApplicationAsset(this.client, raw);
      collection.set(asset.id, asset);
    }
    return collection;
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
      const team = new Team(this.client, data);
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

  async fetchThreadMembers(
    channelId: string,
  ): Promise<BaseCollection<string, ThreadMember>> {
    const data = await this.raw.fetchThreadMembers(channelId);
    const collection = new BaseCollection<string, ThreadMember>();

    for (let raw of data) {
      const threadMember = new ThreadMember(this.client, data);
      collection.set(threadMember.userId, threadMember);
    }
    return collection;
  }

  async fetchUser(
    userId: string,
  ): Promise<User> {
    const data = await this.raw.fetchUser(userId);
    let user: User;
    if (this.client.users.has(data.id)) {
      user = this.client.users.get(data.id)!;
      user.merge(data);
    } else {
      user = new User(this.client, data);
    }
    return user;
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
  ): Promise<Message> {
    const data = await this.raw.fetchWebhookTokenMessage(webhookId, webhookToken, messageId);

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
