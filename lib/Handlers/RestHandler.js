'use strict';

const BaseCollection = require('../Collections/BaseCollection.js');

const Structures = require('../Structures');
const Utils = require('../Utils');
const Constants = Utils.Constants;
const Endpoints = Constants.Endpoints;

class RestHandler
{
    constructor(client, options)
    {
        this.client = client;
        this.rest = this.client.rest;
    }

    addMember(guild, user)
    {

    }

    addMemberRole(guild, user, role)
    {

    }

    addPinnedMessage(channel, message)
    {

    }

    addRecipient(channel, user)
    {

    }

    beginPrune(guild, data={})
    {

    }

    bulkDeleteMessages(channel)
    {

    }

    createBan(guild, user, data={})
    {

    }

    createChannel(guild, data={})
    {

    }

    createDM(data={})
    {
        '@me';
    }

    createEmoji(guild, data={})
    {

    }

    createGuild(data={})
    {

    }

    createGuildIntegration(guild, data={})
    {

    }

    createInvite(channel, data={})
    {

    }

    createMessage(channel, data={})
    {
        return new Promise((resolve, reject) => {
            const channelId = (typeof(channel) === 'object') ? channel.id : channel;
            if (!channelId) {
                reject(new Error('Channel ID is missing!'));
                return;
            } else if (typeof(channel) === 'number') {
                reject(new Error('Channel ID has to be a string!'));
                return;
            }

            const body = {};
            const files = [];
            if (typeof(data) === 'string') {
                body.content = data;
                data = {};
            } else {
                body.content = data.content;
            }
            if (data.embed !== undefined) {
                body.embed = data.embed;
            }
            if (data.file) {
                files.push(data.file);
            }
            if (data.files && data.files.length) {
                data.files.forEach((file) => {
                    files.push(file);
                });
            }
            if (data.tts !== undefined) {
                body.tts = !!data.tts;
            }
            if (!body.content && !body.embed && !files.length) {
                reject(new Error('Cannot send an empty message.'));
                return;
            }
            body.nonce = data.nonce || Utils.Snowflake.generate(); //noncing ;)
            this.rest.request({
                route: {
                    method: 'post',
                    path: Endpoints.REST.CHANNELS.MESSAGES,
                    params: {channelId}
                },
                useAuth: true,
                json: true,
                body,
                files
            }).then((data) => {
                const message = new Structures.Message(this.client, data);
                this.client.messages.update(message);
                resolve(message);
            }).catch(reject);
        });
    }

    createReaction(channel, mssage, emoji)
    {

    }

    createRole(guild, data={})
    {

    }

    createWebhook(channel, data={})
    {

    }

    deleteChannel(channelId)
    {
        return new Promise((resolve, reject) => {
            if (typeof(channelId) === 'object') {
                channelId = channelId.id;
            }
            if (!channelId) {
                reject(new Error('Channel ID is required.'));
                return;
            }
            this.rest.request({
                route: {
                    method: 'delete',
                    path: Endpoints.REST.CHANNELS.ID,
                    params: {channelId}
                }
            }).then((raw) => {
                var channel = this.client.channels.get(data.id);
                if (channel) {
                    channel = channel.merge(raw).clone();
                    this.client.channels.delete(channel.id);
                } else {
                    channel = Structures.Channel.create(this.client, raw);
                }
                resolve(channel);
            }).catch(reject);
        });
    }

    deleteChannelOverwrite(channel, overwrite)
    {

    }

    deleteEmoji(guild, emoji)
    {

    }

    deleteGuild(guild)
    {

    }

    deleteGuildIntegration(guild, integration)
    {

    }

    deleteInvite(invite)
    {

    }

    deleteMessage(channel, message)
    {

    }

    deletePinnedMessage(channel, message)
    {

    }

    deleteReaction(channel, message, emoji, user)
    {

    }

    deleteReactions(channel, message)
    {

    }

    deleteRole(guild, role)
    {

    }

    deleteWebhook(webhook)
    {

    }

    deleteWebhookToken(webhook, token)
    {

    }

    editChannel(channel, data={})
    {
        return new Promise((resolve, reject) => {
            
        });
    }

    editChannelPositions(guild, data={})
    {

    }

    editChannelPermissions(channel, overwrite, data={})
    {

    }

    editEmoji(guild, emoji, data={})
    {

    }

    editGuild(guild)
    {

    }

    editGuildEmbed(guild, data={})
    {

    }

    editGuildIntegration(guild, integration, data={})
    {
        
    }

    editGuildVanityUrl(guild, data={})
    {

    }

    editMember(guild, user)
    {

    }

    editMessage(channel, message, data={})
    {
        return new Promise((resolve, reject) => {

        });
    }

    editNick(guild, data={})
    {

    }

    editRole(guild, role, data={})
    {

    }

    editRolePositions(guild, data={})
    {

    }

    editUser(user, data={})
    {

    }

    editWebhook(webhook, data={})
    {

    }

    editWebhookToken(webhook, token, data={})
    {

    }

    executeWebhook(webhook, token, compatible)
    {
        //github/slack/none
    }

    fetchBans(guildId)
    {
        return new Promise((resolve, reject) => {
            if (typeof(guildId) === 'object') {
                guildId = guildId.id;
            }
            this.rest.request({
                route: {
                    method: 'get',
                    path: Endpoints.REST.GUILDS.BANS,
                    params: {guildId}
                }
            }).then((raw) => {
                const bans = new BaseCollection();
                raw.forEach((rawBan) => {
                    let user;
                    if (this.client.users.has(rawBan.user.id)) {
                        user = this.client.users.get(rawBan.user.id);
                        user.merge(rawBan.user);
                    } else {
                        user = new Structures.User(this.client, rawBan.user);
                        this.client.users.update(user);
                    }
                    bans.set(rawBan.user.id, {
                        reason: rawBan.reason,
                        user: user
                    });
                });
                resolve(bans);
            }).catch(reject);
        });
    }

    fetchChannelInvites(channel)
    {

    }

    fetchChannelWebhooks(channel)
    {

    }

    fetchConnections()
    {
        '@me';
    }

    fetchDMs()
    {
        return new Promise((resolve, reject) => {
            this.rest.request({
                method: 'get',
                path: Endpoints.USERS.CHANNELS,
                params: {
                    userId: '@me'
                }
            }).then((raw) => {
                const channels = new BaseCollection();
                raw.forEach((rawChannel) => {
                    const channel = Structures.Channel.create(this.client, rawChannel);
                    this.client.channels.update(channel);
                    channels.set(channel.id, channel);
                });
                resolve(channels);
            }).catch(reject);
        });
    }

    fetchEmoji(guild, emoji)
    {

    }

    fetchEmojis(guild)
    {

    }

    fetchGateway()
    {
        return new Promise((resolve, reject) => {
            this.rest.request({
                route: {
                    method: 'get',
                    path: Endpoints.REST.GATEWAY
                }
            }).then(resolve).catch(reject);
        });
    }

    fetchGuilds(user)
    {

    }

    fetchGuild(guild)
    {

    }

    fetchGuildAuditLogs(guild, query={})
    {

    }

    fetchGuildEmbed(guild)
    {

    }

    fetchGuildIntegrations(guild)
    {

    }

    fetchGuildInvites(guild)
    {

    }

    fetchGuildVanityUrl(guild)
    {

    }

    fetchGuildWebhooks(guild)
    {

    }

    fetchInvite(invite)
    {
        
    }

    fetchMember(guild, user)
    {

    }

    fetchMembers(guild)
    {

    }

    fetchPinnedMessages(channel)
    {

    }

    fetchPruneCount(guild)
    {

    }

    fetchReactions(channel, message, emoji)
    {
        //if no emoji, just /reactions
    }

    fetchRoles(guild)
    {

    }

    fetchUser(userId)
    {
        return new Promise((resolve, reject) => {
            if (!userId) {
                userId = '@me';
            }
            if (typeof(userId) === 'object') {
                userId = userId.id;
            }
            this.rest.request({
                route: {
                    method: 'get',
                    path: Endpoints.REST.USERS.ID,
                    params: {userId}
                }
            }).then((raw) => {
                if (this.client.users.has(raw.id)) {
                    const user = this.client.users.get(raw.id);
                    user.merge(raw);
                    resolve(user);
                } else {
                    if (raw.id === this.client.user.id) {
                        this.client.user.merge(raw);
                        resolve(this.client.user);
                    } else {
                        const user = new Structures.User(this.client, raw);
                        this.client.users.update(user);
                        resolve(user);
                    }
                }
            }).catch(reject);
        });
    }

    fetchWebhook(webhook)
    {

    }

    fetchWebhookToken(webhook, token)
    {

    }

    fetchVoiceRegions(guildId)
    {
        return new Promise((resolve, reject) => {
            const route = {
                method: 'get',
                path: Endpoints.REST.VOICE_REGIONS
            };
            if (guildId) {
                route.path = Endpoints.REST.GUILDS.REGIONS;
                if (typeof(guildId) === 'object') {
                    guildId = guildId.id;
                }
                route.params = {guildId};
            }

            this.rest.request({route}).then(resolve).catch(reject);
        });
    }

    leaveGuild(guildId)
    {
        return new Promise((resolve, reject) => {
            if (typeof(guildId) === 'object') {
                guildId = guildId.id;
            }
            this.rest.request({
                route: {
                    method: 'delete',
                    path: Endpoints.REST.USERS.GUILD,
                    params: {
                        guildId,
                        userId: '@me'
                    }
                }
            }).then(resolve).catch(reject);
        });
    }

    removeBan(guild, user)
    {

    }

    removeMember(guild, user)
    {

    }

    removeMemberRole(guild, user, role)
    {

    }

    removeRecipient(channel, user)
    {

    }

    syncIntegration(guild, integration)
    {

    }

    triggerTyping(channel)
    {

    }
}

module.exports = RestHandler;