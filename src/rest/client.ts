import {
  Client as RestClient,
  ClientOptions,
  Types as Options,
} from 'detritus-client-rest';

import { Client as ShardClient } from '../client';
import { anyToCamelCase } from '../utils';

import { BaseCollection } from '../collections/basecollection';

import {
  Application,
  ApplicationNews,
  AuditLog,
  ChannelBase,
  ChannelDM,
  ConnectedAccount,
  createChannelFromData,
  Emoji,
  Gift,
  Guild,
  Integration,
  Invite,
  Message,
  PremiumSubscription,
  Profile,
  Role,
  Team,
  TeamMember,
  User,
  UserWithFlags,
  UserWithToken,
  VoiceRegion,
  Webhook,
} from '../structures';

import * as Types from './types';


export class Client extends RestClient {
  readonly client: ShardClient;

  constructor(
    token: string,
    options: ClientOptions,
    client: ShardClient,
  ) {
    super(token, options);

    this.client = client;
    Object.defineProperty(this, 'client', {
      enumerable: false,
      writable: false,
    });
  }

  async createChannelInvite(
    channelId: string,
    options: Options.CreateChannelInvite,
  ): Promise<null> {
    const data = super.createChannelInvite.call(this, channelId, options);
    return data;
  }

  async editChannelOverwrite(
    channelId: string,
    overwriteId: string,
    options: Options.EditChannelOverwrite = {},
  ): Promise<any> {
    return super.editChannelOverwrite.call(this, channelId, overwriteId, options);
  }

  async createDm(
    options: Options.CreateDm,
  ): Promise<ChannelDM> {
    const data = await super.createDm.call(this, options);
    let channel: ChannelDM;
    if (this.client.channels.has(data.id)) {
      channel = <ChannelDM> this.client.channels.get(data.id);
      channel.merge(data);
      // this should never happen lmao
    } else {
      channel = <ChannelDM> createChannelFromData(this.client, data);
      this.client.channels.insert(channel);
    }
    return channel;
  }

  async createGuild(
    options: Options.CreateGuild,
  ): Promise<Guild> {
    const data = await super.createGuild.call(this, options);
    let guild: Guild;
    if (this.client.guilds.has(data.id)) {
      guild = <Guild> this.client.guilds.get(data.id);
      guild.merge(data);
    } else {
      guild = <Guild> new Guild(this.client, data);
      this.client.guilds.insert(guild);
    }
    return guild;
  }

  async createGuildChannel(
    guildId: string,
    options: Options.CreateGuildChannel,
  ): Promise<ChannelBase> {
    const data = await super.createGuildChannel.call(this, guildId, options);
    let channel: ChannelBase;
    if (this.client.channels.has(data.id)) {
      channel = <ChannelBase> this.client.channels.get(data.id);
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
    options: Options.CreateGuildEmoji,
  ): Promise<Emoji> {
    const data = await super.createGuildEmoji.call(this, guildId, options);
    let emoji: Emoji;
    if (this.client.emojis.has(data.id)) {
      emoji = <Emoji> this.client.emojis.get(data.id);
      emoji.merge(data);
    } else {
      data.guild_id = guildId;
      emoji = new Emoji(this.client, data);
      this.client.emojis.insert(emoji);
    }
    return emoji;
  }

  async createGuildRole(
    guildId: string,
    options: Options.CreateGuildRole,
  ): Promise<Role> {
    const data = await super.createGuildRole.call(this, guildId, options);
    data.guild_id = guildId;
    const role = new Role(this.client, data);
    if (this.client.guilds.has(guildId)) {
      (<Guild> this.client.guilds.get(guildId)).roles.set(role.id, role);
    }
    return role;
  }

  async createMessage(
    channelId: string,
    options: Options.CreateMessage,
  ): Promise<any> {
    const data = await super.createMessage.call(this, channelId, options);
    if (this.client.channels.has(data.channel_id)) {
      const channel = <ChannelBase> this.client.channels.get(data.channel_id);
      if (channel.guildId) {
        data.guild_id = channel.guildId;
      }
    }
    const message = new Message(this.client, data);
    this.client.messages.insert(message);
    return data;
  }

  async createWebhook(
    channelId: string,
    options: Options.CreateWebhook,
  ): Promise<Webhook> {
    const data = await super.createWebhook.call(this, channelId, options);
    return new Webhook(this.client, data);
  }

  async deleteChannel(channelId: string): Promise<ChannelBase> {
    const data = await super.deleteChannel.call(this, channelId);
    let channel: ChannelBase;
    if (this.client.channels.has(data.id)) {
      channel = <ChannelBase> this.client.channels.get(data.id);
      this.client.channels.delete(data.id);
      channel.merge(data);
    } else {
      channel = createChannelFromData(this.client, data);
    }
    return channel;
  }

  async editChannel(
    channelId: string,
    options: Options.EditChannel,
  ): Promise<ChannelBase> {
    const data = await super.editChannel.call(this, channelId, options);
    let channel: ChannelBase;
    if (this.client.channels.has(data.id)) {
      channel = <ChannelBase> this.client.channels.get(data.id);
      channel.merge(data);
    } else {
      channel = createChannelFromData(this.client, data);
      // insert? nah
    }
    return channel;
  }

  async editMessage(
    channelId: string,
    messageId: string,
    options: Options.EditMessage,
  ): Promise<Message> {
    const data = await super.editMessage.call(this, channelId, messageId, options);
    let message: Message;
    if (this.client.messages.has(data.id)) {
      message = <Message> this.client.messages.get(data.id);
      message.merge(data);
    } else {
      message = new Message(this.client, data);
      // should we really merge? the message_update event wont have differences then
      this.client.messages.insert(message);
    }
    return message;
  }

  async editTeam(
    teamId: string,
    options: Options.EditTeam = {},
  ): Promise<any> {
    return super.editTeam.call(this, teamId, options);
  }

  async editWebhook(
    webhookId: string,
    options: Options.EditWebhook,
  ): Promise<Webhook> {
    const data = await super.editWebhook.call(this, webhookId, options);
    return new Webhook(this.client, data);
  }

  async editWebhookToken(
    webhookId: string,
    token: string,
    options: Options.EditWebhook,
  ): Promise<Webhook> {
    const data = await super.editWebhookToken.call(this, webhookId, token, options);
    return new Webhook(this.client, data);
  }

  async executeWebhook(
    webhookId: string,
    token: string,
    options: Options.ExecuteWebhook = {},
    compatibleType?: string,
  ): Promise<Message | null> {
    const data = await super.executeWebhook.call(this, webhookId, token, options, compatibleType);
    if (options.wait) {
      const message = new Message(this.client, data);
      this.client.messages.insert(message);
      return message;
    }
    return data;
  }

  async fetchApplicationNews(
    applicationIds?: Array<string> | string,
  ): Promise<BaseCollection<string, ApplicationNews>> {
    const data = await super.fetchApplicationNews.call(this, applicationIds);
    const collection = new BaseCollection<string, ApplicationNews>();
    for (let raw of data) {
      collection.set(raw.id, new ApplicationNews(this.client, raw));
    }
    return collection;
  }

  async fetchApplicationNewsId(newsId: string): Promise<ApplicationNews> {
    const data = await super.fetchApplicationNewsId.call(this, newsId);
    return new ApplicationNews(this.client, data);
  }

  async fetchApplications(): Promise<Array<Application>> {
    const applications: Array<any> = await super.fetchApplications.call(this);
    return applications.map((data: any) => new Application(this.client, data));
  }

  async fetchChannelInvites(
    channelId: string,
  ): Promise<BaseCollection<string, Invite>> {
    const data: Array<any> = await super.fetchChannelInvites.call(this, channelId);
    const invites = new BaseCollection<string, Invite>();
    for (let raw of data) {
      const invite = new Invite(this.client, raw);
      invites.set(invite.code, invite);
    }
    return invites;
  }

  async fetchChannelWebhooks(
    channelId: string,
  ): Promise<BaseCollection<string, Webhook>> {
    const data: Array<any> = await super.fetchChannelWebhooks.call(this, channelId);
    const webhooks = new BaseCollection<string, Webhook>();
    for (let raw of data) {
      const webhook = new Webhook(this.client, raw);
      webhooks.set(webhook.id, webhook);
    }
    return webhooks;
  }

  async fetchDms(userId: string = '@me'): Promise<BaseCollection<string, ChannelDM>> {
    const data: Array<any> = await super.fetchDms.call(this, userId);
    const channels = new BaseCollection<string, ChannelDM>();
    for (let raw of data) {
      let channel: ChannelDM;
      if (this.client.channels.has(raw.id)) {
        channel = <ChannelDM> this.client.channels.get(raw.id);
        channel.merge(raw);
      } else {
        channel = createChannelFromData(this.client, raw);
        this.client.channels.insert(channel);
      }
      channels.set(channel.id, channel);
    }
    return channels;
  }

  async fetchGiftCode(
    code: string,
    options: Options.FetchGiftCode,
  ): Promise<Gift> {
    const data = await super.fetchGiftCode.call(this, code, options);
    return new Gift(this.client, data);
  }

  async fetchGuild(guildId: string): Promise<Guild> {
    const data = await super.fetchGuild.call(this, guildId);
    let guild: Guild;
    if (this.client.guilds.has(data.id)) {
      guild = <Guild> this.client.guilds.get(data.id);
      guild.merge(data);
    } else {
      guild = new Guild(this.client, data);
    }
    return guild;
  }

  async fetchGuilds(): Promise<BaseCollection<string, Guild>> {
    const data: Array<any> = await super.fetchGuilds.call(this);
    const guilds = new BaseCollection<string, Guild>();
    for (let raw of data) {
      let guild: Guild;
      if (this.client.guilds.has(raw.id)) {
        guild = <Guild> this.client.guilds.get(raw.id);
        guild.merge(raw);
      } else {
        guild = new Guild(this.client, raw);
      }
    }
    return guilds;
  }

  async fetchGuildAuditLogs(
    guildId: string,
    options: Options.FetchGuildAuditLogs,
  ): Promise<BaseCollection<string, AuditLog>> {
    const data = await super.fetchGuildAuditLogs.call(this, guildId, options);
    const auditLogs = new BaseCollection<string, AuditLog>();
    for (let raw of data.audit_log_entries) {
      let target: null | User | Webhook = null;
      if (this.client.users.has(raw.target_id)) {
        target = <User> this.client.users.get(raw.target_id);
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
        user = <User> this.client.users.get(raw.user_id);
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
      auditLogs.set(auditLog.id, auditLog);
    }
    return auditLogs;
  }

  async fetchGuildIntegrations(
    guildId: string,
  ): Promise<BaseCollection<string, Integration>> {
    const data = await super.fetchGuildIntegrations.call(this, guildId);
    const collection = new BaseCollection<string, Integration>();
    for (let raw of data) {
      raw.guild_id = guildId;
      const integration = new Integration(this.client, raw);
      collection.set(integration.id, integration);
    }
    return collection;
  }

  async fetchGuildPremiumSubscriptions(
    guildId: string,
  ): Promise<BaseCollection<string, PremiumSubscription>> {
    const data = await super.fetchGuildPremiumSubscriptions.call(this, guildId);
    const subscriptions = new BaseCollection<string, PremiumSubscription>();
    for (let raw of data) {
      const subscription = new PremiumSubscription(this.client, raw);
      subscriptions.set(subscription.id, subscription);
    }
    return subscriptions;
  }

  async fetchInvite(
    code: string,
    options: Options.FetchInvite
  ): Promise<Invite> {
    const data = await super.fetchInvite.call(this, code, options);
    return new Invite(this.client, data);
  }

  async fetchMeConnections(): Promise<BaseCollection<string, ConnectedAccount>> {
    const data = await super.fetchMeConnections.call(this);
    const collection = new BaseCollection<string, ConnectedAccount>();
    for (let raw of data) {
      const connectedAccount = new ConnectedAccount(this.client, raw);
      collection.set(connectedAccount.id, connectedAccount);
    }
    return collection;
  }

  async fetchOauth2Application(
    userId: string = '@me',
  ): Promise<Types.fetchOauth2Application> {
    const data = anyToCamelCase(
      await super.fetchOauth2Application.call(this, userId),
      ['bot', 'owner', 'team'],
    );
    if (this.client.users.has(data.owner.id)) {
      // dont use the cache since this object has flags key, just update the cache
      (<User> this.client.users.get(data.owner.id)).merge(data.owner);
    }

    data.owner = new UserWithFlags(this.client, data.owner);
    if (userId === '@me') {
      this.client.owners.clear();
      this.client.owners.set(data.owner.id, data.owner);
      if (data.team !== null) {
        data.team = new Team(this.client, data.team);
        for (let member of data.team.members.values()) {
          this.client.owners.set(member.user.id, member.user);
        }
      }
    } else {
      if (data.bot) {
        data.bot = new UserWithToken(this.client, data.bot);
      }
    }
    return data;
  }

  async fetchTeam(teamId: string): Promise<Team> {
    const data = await super.fetchTeam.call(this, teamId);
    return new Team(this.client, data);
  }

  async fetchTeamMembers(teamId: string): Promise<BaseCollection<string, TeamMember>> {
    const data: Array<any> = await super.fetchTeamMembers.call(this, teamId);
    const collection = new BaseCollection<string, TeamMember>();
    for (let raw of data) {
      collection.set(raw.user.id, new TeamMember(this.client, raw));
    }
    return collection;
  }

  async fetchTeamMember(teamId: string, userId: string): Promise<TeamMember> {
    const data = await super.fetchTeamMember.call(this, teamId, userId);
    return new TeamMember(this.client, data);
  }

  async fetchUserProfile(userId: string): Promise<Profile> {
    const data = await super.fetchUserProfile.call(this, userId);
    return new Profile(this.client, data);
  }

  async fetchVoiceRegions(
    guildId?: string,
  ): Promise<BaseCollection<string, VoiceRegion>> {
    const data = await super.fetchVoiceRegions.call(this, guildId);
    const regions = new BaseCollection<string, VoiceRegion>();
    for (let raw of data) {
      const region = new VoiceRegion(this.client, raw);
      regions.set(region.id, region);
    }
    return regions;
  }
}
