'use strict';

const BaseCollection = require('../Collections/BaseCollection.js');

const Structures = require('../Structures');
const Utils = require('../Utils');
const Constants = Utils.Constants;
const Endpoints = Constants.Endpoints;

class RestEndpoints
{
    constructor(rest)
    {
        this.rest = rest;
        this.client = this.rest.client;
    }

    createBody(defaults, data)
    {
        const body = {};
        for (let key in defaults) {
            if (!(key in data)) {
                if (defaults[key].notOptional) {
                    throw new Error(`${key} is not optional.`);
                } else {
                    continue;
                }
            }
            switch (defaults[key].type) {
                case 'bool': data[key] = Boolean(data[key]); break;
                case 'string': data[key] = String(data[key]); break;
                case 'integer':
                    data[key] = parseInt(data[key]);
                    if (data[key] === NaN) {
                        throw new Error(`${key} has to be an integer.`);
                    }
                    break;
                case 'array':
                    if (!Array.isArray(data[key])) {
                        throw new Error(`${key} has to be an array!`);
                    }
                    break;
                case 'snowflake':
                    if (!(/\d+/).exec(data[key])) {
                        throw new Error(`${key} has to be a snowflake!`);
                    }
                    break;
                case 'object':
                    if (typeof(data[key]) !== 'object') {
                        throw new Error(`${key} has to be an object!`);
                    }
            }
            body[key] = data[key];
        }
        return body;
    }

    addMember(guild, user)
    {

    }

    addMemberRole(guild, user, role)
    {

    }

    addPinnedMessage(channelId, messageId)
    {
        return new Promise((resolve, reject) => {
            if (!channelId) {reject(new Error('ChannelId is required!')); return;}
            if (!messageId) {reject(new Error('MessageId is required!')); return;}
            if (typeof(channelId) === 'object') {channelId = channelId.id;}
            if (typeof(messageId) === 'object') {messageId = messageId.id;}

            this.rest.request({
                route: {
                    method: 'put',
                    path: Endpoints.REST.CHANNELS.MESSAGE_PIN,
                    params: {channelId, messageId}
                }
            }).then(resolve).catch(reject);
        });
    }

    addRecipient(channelId, userId, body={})
    {
        return new Promise((resolve, reject) => {
            if (!channelId) {reject(new Error('ChannelId is required!')); return;}
            if (!userId) {reject(new Error('UserId is required!')); return;}

            if (typeof(channelId) === 'object') {channelId = channelId.id;}
            if (typeof(userId) === 'object') {userId = userId.id;}

            body = this.createBody({
                'access_token': {type: 'string'},
                'nick': {type: 'string'}
            }, body);

            if (!Object.keys(body).length) {body = undefined;}

            this.rest.request({
                route: {
                    method: 'put',
                    path: Constants.Endpoints.REST.CHANNELS.RECIPIENT,
                    params: {channelId, userId}
                },
                jsonify: true,
                body
            }).then(resolve).catch(reject);
        });
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

    createMessage(channelId, body={})
    {
        return new Promise((resolve, reject) => {
            if (!channelId) {reject(new Error('ChannelId is required!')); return;}
            if (typeof(channelId) === 'object') {channelId = channelId.id;}

            if (typeof(body) === 'string') {
                body = {content: body};
            }

            if (body.file) {
                body.files = body.files || [];
                body.files.push(body.file);
            }

            body = this.createBody({
                content: {type: 'string'},
                tts: {type: 'bool'},
                embed: {type: 'object'},
                files: {type: 'array'},
                nonce: {}
            }, body);

            const files = [];
            if (body.files && body.files.length) {
                body.files.forEach((file) => files.push(file));
                delete body.files;
            }

            if (!body.content && !body.embed && !files.length) {
                reject(new Error('Cannot send an empty message.'));
                return;
            }

            body.nonce = body.nonce || Utils.Snowflake.generate();

            this.rest.request({
                route: {
                    method: 'post',
                    path: Endpoints.REST.CHANNELS.MESSAGES,
                    params: {channelId}
                },
                jsonify: true,
                body,
                files
            }).then(({response, data}) => {
                const message = new Structures.Message(this.client, data);
                this.client.messages.update(message);
                resolve(message);
            }).catch(reject);
        });
    }

    createReaction(channelId, messageId, emoji)
    {
        return new Promise((resolve, reject) => {
            if (!channelId) {reject(new Error('ChannelId is required!')); return;}
            if (!messageId) {reject(new Error('MessageId is required!')); return;}
            if (!emoji) {reject(new Error('Emoji is required!')); return;}
            if (typeof(channelId) === 'object') {channelId = channelId.id;}
            if (typeof(messageId) === 'object') {messageId = messageId.id;}
            if (typeof(emoji) === 'object') {emoji = emoji.endpointFormat;}

            this.rest.request({
                route: {
                    method: 'put',
                    path: Endpoints.REST.CHANNELS.MESSAGE_REACTION_USER,
                    params: {channelId, messageId, emoji, userId: '@me'}
                }
            }).then(resolve).catch(reject);
        });
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
            if (!channelId) {reject(new Error('ChannelId is required!')); return;}
            if (typeof(channelId) === 'object') {channelId = channelId.id;}

            this.rest.request({
                route: {
                    method: 'delete',
                    path: Endpoints.REST.CHANNELS.ID,
                    params: {channelId}
                }
            }).then(({response, data}) => {
                let channel;
                if (this.client.channels.has(data.id)) {
                    channel = this.client.channels.get(data.id).merge(data).clone();
                    this.client.channels.delete(data.id);
                } else {
                    channel = Structures.Channel.create(this.client, data);
                }
                resolve(channel);
            }).catch(reject);
        });
    }

    deleteChannelOverwrite(channel, overwrite)
    {

    }

    deleteEmoji(guildId, emojiId)
    {
        return new Promise((resolve, reject) => {
            if (!guildId) {reject(new Error('GuildId is required!')); return;}
            if (!emojiId) {reject(new Error('EmojiId is required!')); return;}
            if (typeof(guildId) === 'object') {guildId = guildId.id;}
            if (typeof(emojiId) === 'object') {emojiId = emojiId.id;}

            this.rest.request({
                route: {
                    method: 'delete',
                    path: Endpoints.REST.GUILDS.EMOJI,
                    params: {guildId, emojiId}
                }
            }).then(resolve).catch(reject);
        });
    }

    deleteGuild(guild)
    {

    }

    deleteGuildIntegration(guild, integration)
    {

    }

    deleteInvite(code)
    {
        return new Promise((resolve, reject) => {
            if (!code) {reject(new Error('Code is required!')); return;}
            if (typeof(code) === 'object') {code = code.code;}

            this.rest.request({
                route: {
                    method: 'delete',
                    path: Endpoints.REST.INVITE,
                    params: {code}
                }
            }).then(({response, data}) => {
                //parse invite data
            }).catch(reject);
        });
    }

    deleteMessage(channelId, messageId)
    {
        return new Promise((resolve, reject) => {
            if (!channelId) {reject(new Error('ChannelId is required!')); return;}
            if (!messageId) {reject(new Error('MessageId is required!')); return;}
            if (typeof(channelId) === 'object') {channelId = channelId.id;}
            if (typeof(messageId) === 'object') {messageId = messageId.id;}

            this.rest.request({
                route: {
                    method: 'delete',
                    path: Endpoints.REST.CHANNELS.MESSAGE,
                    params: {channelId, messageId}
                }
            }).then(resolve).catch(reject);
        });
    }

    deletePinnedMessage(channel, message)
    {
        return new Promise((resolve, reject) => {
            if (!channelId) {reject(new Error('ChannelId is required!')); return;}
            if (!messageId) {reject(new Error('MessageId is required!')); return;}
            if (typeof(channelId) === 'object') {channelId = channelId.id;}
            if (typeof(messageId) === 'object') {messageId = messageId.id;}

            this.rest.request({
                route: {
                    method: 'delete',
                    path: Endpoints.REST.CHANNELS.MESSAGE_PIN,
                    params: {channelId, messageId}
                }
            }).then(resolve).catch(reject);
        });
    }

    deleteReaction(channelId, messageId, emoji, userId)
    {
        return new Promise((resolve, reject) => {
            if (!channelId) {reject(new Error('ChannelId is required!')); return;}
            if (!messageId) {reject(new Error('MessageId is required!')); return;}
            if (!emoji) {reject(new Error('Emoji is required!')); return;}
            if (!userId) {reject(new Error('UserId is required!')); return;}
            if (typeof(channelId) === 'object') {channelId = channelId.id;}
            if (typeof(messageId) === 'object') {messageId = messageId.id;}
            if (typeof(emoji) === 'object') {emoji = emoji.endpointFormat;}
            if (typeof(userId) === 'object') {userId = userId.id;}

            this.rest.request({
                route: {
                    method: 'delete',
                    path: Endpoints.REST.CHANNELS.MESSAGE_REACTION_USER,
                    params: {channelId, messageId, emoji, userId}
                }
            }).then(resolve).catch(reject);
        });
    }

    deleteReactions(channelId, messageId)
    {
        return new Promise((resolve, reject) => {
            if (!channelId) {reject(new Error('ChannelId is required!')); return;}
            if (!messageId) {reject(new Error('MessageId is required!')); return;}
            if (typeof(channelId) === 'object') {channelId = channelId.id;}
            if (typeof(messageId) === 'object') {messageId = messageId.id;}

            this.rest.request({
                route: {
                    method: 'delete',
                    path: Endpoints.REST.CHANNELS.MESSAGE_REACTIONS,
                    params: {channelId, messageId}
                }
            }).then(resolve).catch(reject);
        });
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

    editChannel(channelId, body={})
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

    editEmoji(guildId, emojiId, body={})
    {
        return new Promise((resolve, reject) => {
            if (!guildId) {reject(new Error('GuildId is required!')); return;}
            if (!emojiId) {reject(new Error('EmojiId is required!')); return;}
            if (typeof(guildId) === 'object') {guildId = guildId.id;}
            if (typeof(emojiId) === 'object') {emojiId = emojiId.id;}

            if (typeof(body) === 'string') {body = {name: body};}

            body = this.createBody({
                roles: {type: 'array'},
                name: {type: 'string'}
            }, body);
            
            if (!Object.keys(body).length || (!(body.roles && body.roles.length) && !body.name)) {
                reject(new Error('Emoji Roles and Name cannot be empty!'));
                return;
            }

            if (body.roles) {
                body.roles = body.roles.map((role) => {
                    if (typeof(role) === 'object') {
                        return role.id;
                    } else {
                        return role;
                    }
                });
            }

            this.rest.request({
                route: {
                    method: 'patch',
                    path: Endpoints.REST.GUILDS.EMOJI,
                    params: {guildId, emojiId}
                },
                jsonify: true,
                body
            }).then(resolve).catch(reject);
        });
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

    editMember(guildId, userId, body={})
    {
        return new Promise((resolve, reject) => {
            if (!guildId) {reject(new Error('GuildId is required!')); return;}
            if (!userId) {reject(new Error('UserId is required!')); return;}
            if (typeof(guildId) === 'object') {guildId = guildId.id;}
            if (typeof(userId) === 'object') {userId = userId.id;}

            body = this.createBody({
                mute: {type: 'bool'},
                deafen: {type: 'bool'},
                channel_id: {type: 'string'}
            }, body);

            if (!Object.keys(body).length) {
                reject(new Error('Body cannot be empty!'));
                return;
            }

            this.rest.request({
                route: {
                    method: 'patch',
                    path: Endpoints.REST.GUILDS.MEMBER,
                    params: {guildId, memberId}
                },
                jsonify: true,
                body
            }).then(resolve).catch(reject);
        });
    }

    editMessage(channelId, messageId, body={})
    {
        return new Promise((resolve, reject) => {
            if (!channelId) {reject(new Error('ChannelId is required!')); return;}
            if (!messageId) {reject(new Error('MessageId is required!')); return;}
            if (typeof(channelId) === 'object') {channelId = channelId.id;}
            if (typeof(messageId) === 'object') {messageId = messageId.id;}

            if (typeof(body) === 'string') {body = {content: body};}

            body = this.createBody({
                content: {type: 'string'},
                embed: {type: 'object'}
            }, body);

            if (!Object.keys(body).length) {
                reject(new Error('Body cannot be empty!'));
                return;
            }

            this.rest.request({
                route: {
                    method: 'patch',
                    path: Endpoints.REST.CHANNELS.MESSAGE,
                    params: {channelId, messageId}
                },
                jsonify: true,
                body
            }).then(resolve).catch(reject);
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
            if (!guildId) {reject(new Error('GuildId is required!')); return;}
            if (typeof(guildId) === 'object') {guildId = guildId.id;}

            this.rest.request({
                route: {
                    method: 'get',
                    path: Endpoints.REST.GUILDS.BANS,
                    params: {guildId}
                }
            }).then(({response, data}) => {
                const bans = new BaseCollection();
                data.forEach((raw) => {
                    let user;
                    if (this.client.users.has(raw.user.id)) {
                        user = this.client.users.get(raw.user.id);
                        user.merge(raw.user);
                    } else {
                        user = new Structures.User(this.client, raw.user);
                        this.client.users.update(user);
                    }
                    bans.set(raw.user.id, {
                        reason: raw.reason,
                        user: user
                    });
                });
                resolve(bans);
            }).catch(reject);
        });
    }

    fetchChannelInvites(channelId)
    {
        return new Promise((resolve, reject) => {
            if (!channelId) {reject(new Error('ChannelId is required!')); return;}
            if (typeof(channelId) === 'object') {channelId = channelId.id;}

            this.rest.request({
                route: {
                    method: 'get',
                    path: Endpoints.REST.CHANNELS.INVITES,
                    params: {channelId}
                }
            }).then(({response, data}) => {
                const invites = new BaseCollection();
                data.forEach((raw) => {
                    invites.set(raw.code, raw);
                });
                resolve(invites);
            }).catch(reject);
        });
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
                params: {userId: '@me'}
            }).then(({response, data}) => {
                const channels = new BaseCollection();
                data.forEach((raw) => {
                    let channel;
                    if (this.client.channels.has(raw.id)) {
                        channel = this.client.channels.get(raw.id);
                        channel.merge(raw);
                    } else {
                        channel = Structures.Channel.create(this.client, raw);
                        this.client.channels.update(channel);
                    }
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

    fetchPinnedMessages(channelId)
    {
        return new Promise((resolve, reject) => {
            if (!channelId) {reject(new Error('ChannelId is required!')); return;}
            if (typeof(channelId) === 'object') {channelId = channelId.id;}

            this.rest.request({
                route: {
                    method: 'get',
                    path: Constants.Endpoints.REST.CHANNELS.PINS,
                    params: {channelId}
                }
            }).then(({response, data}) => {
                const messages = new BaseCollection();
                data.forEach((raw) => {
                    let message;
                    if (this.client.messages.has(raw.id)) {
                        message = this.client.messages.get(raw.id);
                        message.merge(raw);
                    } else {
                        message = new Structures.Message(this.client, raw);
                    }
                    messages.set(message.id, message);
                });
                resolve(messages);
            }).catch(reject);
        });
    }

    fetchPruneCount(guild)
    {

    }

    fetchReactions(channelId, messageId, emoji)
    {
        return new Promise((resolve, reject) => {
            if (!channelId) {reject(new Error('ChannelId is required!')); return;}
            if (!messageId) {reject(new Error('MessageId is required!')); return;}
            if (typeof(channelId) === 'object') {channelId = channelId.id;}
            if (typeof(messageId) === 'object') {messageId = messageId.id;}

            const route = {
                method: 'get',
                path: null,
                params: {channelId, messageId}
            };
            if (emoji) {
                if (typeof(emoji) === 'object') {emoji = emoji.endpointFormat;}
                route.path = Endpoints.REST.CHANNELS.MESSAGE_REACTION;
                route.params.emoji = emoji;
                this.rest.request({
                    route
                }).then(({response, data}) => {
                    const users = new BaseCollection();
                    data.forEach((raw) => {
                        let user;
                        if (this.client.users.has(raw.id)) {
                            user = this.client.users.get(raw.id);
                            user.merge(raw);
                        } else {
                            user = new Structures.User(this.client, raw);
                            this.client.users.update(user);
                        }
                        users.set(user.id, user);
                    });
                    resolve(users);
                }).catch(reject);
            } else {
                route.path = Endpoints.REST.CHANNELS.MESSAGE_REACTIONS;
                this.rest.request({
                    route
                }).then(({response, data}) => {
                    //all reactions here
                    resolve({response, data});
                }).catch(reject);
            }
        });
        //if no emoji, just /reactions
    }

    fetchRoles(guild)
    {

    }

    fetchUser(userId)
    {
        //work
        return new Promise((resolve, reject) => {
            if (!userId) {userId = '@me';}
            if (typeof(userId) === 'object') {userId = userId.id;}
            this.rest.request({
                route: {
                    method: 'get',
                    path: Endpoints.REST.USERS.ID,
                    params: {userId}
                }
            }).then(({response, data}) => {
                let user;

                if (this.client.users.has(data.id)) {
                    user = this.client.users.get(data.id);
                    user.merge(data);
                } else {
                    if (data.id === this.client.user.id) {
                        user = this.client.user;
                        user.merge(data);
                    } else {
                        user = new Structures.User(this.client, data);
                        this.client.users.update(user);
                    }
                }

                resolve(user);
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
            if (!guildId) {reject(new Error('GuildId is required!')); return;}
            if (typeof(guildId) === 'object') {guildId = guildId.id;}

            this.rest.request({
                route: {
                    method: 'delete',
                    path: Endpoints.REST.USERS.GUILD,
                    params: {userId: '@me', guildId}
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

    removeRecipient(channelId, userId)
    {
        return new Promise((resolve, reject) => {
            if (!channelId) {reject(new Error('ChannelId is required!')); return;}
            if (!userId) {reject(new Error('UserId is required!')); return;}
            if (typeof(channelId) === 'object') {channelId = channelId.id;}
            if (typeof(userId) === 'object') {userId = userId.id;}

            this.rest.request({
                route: {
                    method: 'delete',
                    path: Endpoints.REST.CHANNELS.RECIPIENT,
                    params: {channelId, userId}
                }
            }).then(resolve).catch(reject);
        });
        //work
    }

    syncIntegration(guild, integration)
    {

    }

    triggerTyping(channelId)
    {
        return new Promise((resolve, reject) => {
            if (!channelId) {reject(new Error('ChannelId is required!')); return;}
            if (typeof(channelId) === 'object') {channelId = channelId.id;}

            this.rest.request({
                route: {
                    method: 'post',
                    path: Constants.Endpoints.REST.CHANNELS.TYPING,
                    params: {channelId}
                }
            }).then(resolve).catch(reject);
        });
    }
}

module.exports = RestEndpoints;