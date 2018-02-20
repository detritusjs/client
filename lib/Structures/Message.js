const BaseCollection = require('../Collections/BaseCollection.js');
const BaseStructure = require('./BaseStructure.js');
const Structures = require('./index.js');

const Utils = require('../Utils');
const Constants = Utils.Constants;

const def = {
    id: null,
    activity: {},
    application: {},
    attachments: [],
    author: {},
    call: {},
    channel_id: null,
    content: '',
    edited_timestamp: null,
    embeds: [],
    mentions: [],
    mention_everyone: false,
    mention_roles: [],
    nonce: null,
    pinned: false,
    reactions: [],
    timestamp: '',
    tts: false,
    type: Constants.MessageTypes.BASE,
    webhook_id: null
};

class Message extends BaseStructure
{
    constructor(client, raw)
    {
        raw = Object.assign({}, def, raw);
        let cache = {
            attachments: new BaseCollection(),
            author: client.users.get(raw.author.id),
            embeds: new BaseCollection(),
            mentions: new BaseCollection(),
            mention_roles: new BaseCollection(),
            reactions: new BaseCollection(),
            raw: {
                attachments: raw.attachments,
                content: raw.content,
                embeds: raw.embeds,
                mentions: raw.mentions,
                mention_roles: raw.mention_roles,
                reactions: raw.reactions
            }
        };

        if (!cache.author) {
            cache.author = new Structures.User(client, raw.author);
            client.users.update(cache.author);
        }

        super(client, raw, ['content'].concat(Object.keys(cache)));

        for (let key in cache) {
            if (key === 'raw') {continue;}
            const camelKey = Utils.Tools.toCamelCase(key);
            Object.defineProperty(this, camelKey, {
                enumerable: false,
                writable: false,
                configurable: true,
                value: cache[key]
            });
            delete cache[key];
        }

        this.merge(cache.raw);
        cache = null;
    }

    get channel()
    {
        return this._client.channels.get(this.channelId);
    }

    get createdAt()
    {
        return new Date(this.createdAtUnix);
    }

    get createdAtUnix()
    {
        return Utils.Snowflake.timestamp(this.id);
    }

    get fromSystem()
    {
        return this.type !== Constants.MessageTypes.DEFAULT;
    }

    get fromWebhook()
    {
        return !!this.webhook_id;
    }

    get member()
    {
        const channel = this.channel;
        if (channel && !channel.isDM) {
            return this._client.members.get(channel.guildId, this.author.id);
        }
    }
    
    get guild()
    {
        const channel = this.channel;
        if (channel && !channel.isDm) {
            return this._client.guilds.get(channel.guildId);
        }
    }

    get isDm()
    {
        const channel = this.channel;
        return (channel) ? channel.isDm : null;
    }

    delete()
    {
        return this._client.rest.request({
            route: {
                method: 'delete',
                path: Constants.Endpoints.REST.CHANNELS.MESSAGE,
                params: {
                    channelId: this.channelId,
                    messageId: this.id
                }
            }
        });
    }

    deleteReactions()
    {
        return this._client.rest.request({
            route: {
                method: 'delete',
                path: Constants.Endpoints.REST.CHANNELS.MESSAGE_REACTIONS,
                params: {
                    channelId: this.channelId,
                    messageId: this.id
                }
            }
        });
    }

    edit(data)
    {
        if (typeof(data) === 'string') {
            data = {
                content: data
            };
        }
        return this._client.editMessage(this.channelId, this.id, data);
    }

    pin()
    {
        return this._client.rest.request({
            route: {
                method: 'put',
                path: Constants.Endpoints.REST.CHANNELS.MESSAGE_PIN,
                params: {
                    channelId: this.channelId,
                    messageId: this.id
                }
            }
        });
    }

    react(emoji)
    {
        if (typeof(emoji) === 'object') {
            emoji = emoji.endpointFormat;
        }
        return this._client.rest.request({
            route: {
                method: 'put',
                path: Constants.Endpoints.REST.CHANNELS.MESSAGE_REACTION_USER,
                params: {
                    channelId: this.channelId,
                    messageId: this.id,
                    emoji: emoji,
                    userId: '@me'
                }
            }
        });
    }

    reply(data)
    {
        if (typeof(data) === 'string') {
            data = {
                content: data
            };
        }
        if (data.mention) {
            data.content = [
                (this.isDm) ? this.author.mention : this.member.mention,
                data.content || null
            ].filter((v)=>v).join(', ');
        }
        return this._client.sendMessage(this.channelId, data);
    }

    unpin()
    {
        return this._client.rest.request({
            route: {
                method: 'delete',
                path: Constants.Endpoints.REST.CHANNELS.MESSAGE_PIN,
                params: {
                    channelId: this.channelId,
                    messageId: this.id
                }
            }
        });
    }

    merge(raw={})
    {
        if (raw.hasOwnProperty('attachments')) {
            this.attachments.clear();
            raw.attachments.forEach((data, i) => {
                this.attachments.set(i, data);
                //use embed objects?
            });
            delete raw.attachments;
        }

        if (raw.hasOwnProperty('embeds')) {
            this.embeds.clear();
            raw.embeds.forEach((data, i) => {
                this.embeds.set(i, data);
                //use embed objects?
            });
            delete raw.embeds;
        }

        if (raw.hasOwnProperty('mentions')) {
            this.mentions.clear();
            raw.mentions.forEach((data) => {
                let user = this._client.users.get(data.id);
                if (!user) {
                    user = new Structures.User(this._client, data);
                    this._client.users.update(user);
                }
                this.mentions.set(user.id, user);
            });
            delete raw.mentions;
        }

        if (raw.hasOwnProperty('mention_roles')) {
            const guild = this.guild;
            this.mentionRoles.clear();
            raw.mention_roles.forEach((data) => {
                if (guild) {
                    this.mentionRoles.set(data, guild.roles.get(data));
                } else {
                    this.mentionRoles.set(data, {id: data});
                }
            });
            delete raw.mention_roles;
        }

        if (raw.hasOwnProperty('reactions')) {
            raw.reactions.forEach((data) => {
                this.reactions.clear();
                this.reactions.set(data.emoji.id || data.emoji.name, new Structures.Reaction(this._client, Object.assign(data, {
                    channel_id: this.channelId,
                    message_id: this.id
                })));
            });
            delete raw.reactions;
        }

        if (raw.hasOwnProperty('content')) {
            switch (this.type)
            {
                case Constants.MessageTypes.RECIPIENT_ADD:
                    raw.content = Constants.SystemMessages.RecipientAdd
                            .replace(/:user:/g, this.author.mention)
                            .replace(/:user2:/g, this.mentions.first().mention);
                    break;
                case Constants.MessageTypes.RECIPIENT_REMOVE:
                    const user = cache.mentions.first();
                    if (user && user.id !== cache.author.id) {
                        raw.content = Constants.SystemMessages.RecipientRemove
                            .replace(/:user:/g, this.author.mention)
                            .replace(/:user2:/g, user.mention);
                    } else {
                        raw.content = Constants.SystemMessages.RecipientRemoveSelf
                            .replace(/:user:/g, this.author.mention);
                    }
                    break;
                case Constants.MessageTypes.CALL:
                    raw.content = Constants.SystemMessages.CallStarted
                        .replace(/:user:/g, this.author.mention);
                    break;
                case Constants.MessageTypes.CHANNEL_NAME_CHANGE:
                    raw.content = Constants.SystemMessages.ChannelNameChange
                        .replace(/:user:/g, this.author.mention)
                        .replace(/:name:/g, raw.content);
                    break;
                case Constants.MessageTypes.CHANNEL_ICON_CHANGE:
                    raw.content = Constants.SystemMessages.ChannelIconChange
                        .replace(/:user:/g, this.author.mention);
                    break;
                case Constants.MessageTypes.CHANNEL_PINNED_MESSAGE:
                    raw.content = Constants.SystemMessages.PinnedMessage
                        .replace(/:user:/g, this.author.mention);
                    break;
                case Constants.MessageTypes.GUILD_MEMBER_JOIN:
                    raw.content = Constants.SystemMessages.GuildMemberJoin[
                            this.createdAtUnix % Constants.SystemMessages.GuildMemberJoin.length
                        ].replace(/:user:/g, this.author.mention);
                    break;
            }
        }

        for (let key in raw) {
            const camelKey = Utils.Tools.toCamelCase(key);
            Object.defineProperty(this, camelKey, {
                enumerable: false,
                writable: false,
                configurable: true,
                value: raw[key]
            });
            delete raw[key];
        }
        raw = null;
    }

    toString()
    {
        return this.id;
    }
}

module.exports = Message;