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
            author: null,
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

        if (client.users.has(raw.author.id)) {
            cache.author = client.users.get(raw.author.id);
            cache.author.merge(raw.author);
        } else {
            cache.author = new Structures.User(client, raw.author);
            client.users.update(cache.author);
        }

        super(client, raw, ['content'].concat(Object.keys(cache)));

        Object.keys(cache).forEach((key) => {
            if (key === 'raw') {return;}
            Object.defineProperty(this, Utils.Tools.toCamelCase(key), {
                configurable: true,
                enumerable: true,
                writable: false,
                value: cache[key]
            });
        });

        this.merge(cache.raw);
    }

    get channel()
    {
        return this.client.channels.get(this.channelId);
    }

    get createdAt()
    {
        return new Date(this.createdAtUnix);
    }

    get createdAtUnix()
    {
        return Utils.Snowflake.timestamp(this.id);
	}
	
	get editedAt()
	{
		return this.editedTimestamp && new Date(this.editedTimestamp);
	}

	get editedAtUnix()
	{
		return this.editedTimestamp && Date.parse(this.editedTimestamp);
	}

	get fromBot()
	{
		return this.author.bot;
	}

	get fromUser()
	{
		return !this.fromBot && !this.fromSystem;
	}

    get fromSystem()
    {
        return this.type !== Constants.MessageTypes.DEFAULT;
    }

    get fromWebhook()
    {
        return !!this.webhookId;
	}
	
	get guild()
    {
        const channel = this.channel;
        if (channel && !channel.isDm) {
            return this.client.guilds.get(channel.guildId);
        }
    }

    get isDm()
    {
        const channel = this.channel;
        return (channel) ? channel.isDm : null;
	}
	
	get member()
    {
        const channel = this.channel;
        if (channel && !channel.isDM) {
            return this.client.members.get(channel.guildId, this.author.id);
        }
	}
	
	get timestampUnix()
	{
		return Date.parse(this.timestamp);
	}

    delete()
    {
        return this.client.rest.endpoints.deleteMessage(this.channelId, this.id);
    }

    deleteReactions()
    {
        return this.client.rest.endpoints.deleteReactions(this.channelId, this.id);
    }

    edit(data)
    {
        return this.client.rest.endpoints.editMessage(this.channelId, this.id, data);
    }

    pin()
    {
        return this.client.rest.endpoints.addPinnedMessage(this.channelId, this.id);
    }

    react(emoji)
    {
        return this.client.rest.endpoints.createReaction(this.channelId, this.id, emoji);
    }

    reply(data)
    {
        return new Promise((resolve, reject) => {
            const payload = {};
            if (typeof(data) === 'string') {
                payload.content = data;
                data = {};
            }
            if (data.mention) {
                data.content = [
                    (this.isDm) ? this.author.mention : this.member.mention,
                    data.content || null
                ].filter((v)=>v).join(', ');
                delete data.mention;
            }
            Object.assign(payload, data);
            this.client.rest.endpoints.createMessage(this.channelId, payload).then(resolve).catch(reject);
        });
    }

    unpin()
    {
        return this.client.rest.endpoints.deletePinnedMessage(this.channelId, this.id);
    }

    merge(raw={})
    {
        for (let key of Object.keys(raw)) {
            switch (key)
            {
                case 'attachments':
                    this.attachments.clear();
                    raw[key].forEach((value, i) => {
                        this.attachments.set(i, value);
                    });
                    //use attachment objects
                    continue;
                case 'embeds':
                    this.embeds.clear();
                    raw[key].forEach((value, i) => {
                        this.embeds.set(i, value);
                    });
                    //use embed objects
                    continue;
                case 'mentions':
                    this.mentions.clear();
                    for (let value of raw[key]) {
                        let user;
                        if (this.client.users.has(value.id)) {
                            user = this.client.users.get(value.id);
                        } else {
                            user = new Structures.User(this.client, value);
                            this.client.users.update(user);
                        }
                        this.mentions.set(user.id, user);
                    }
                    continue;
                case 'mention_roles':
                    const guild = this.guild;
                    this.mentionRoles.clear();
                    for (let value of raw[key]) {
                        if (guild && guild.roles.has(value)) {
                            this.mentionRoles.set(value, guild.roles.get(value));
                        } else {
                            this.mentionRoles.set(value, null);
                        }
                    }
                    continue;
                case 'reactions':
                    this.reactions.clear();
                    for (let value of raw[key]) {
                        Object.assign(value, {'channel_id': this.channelId, 'message_id': this.id});
                        this.reactions.set(value.emoji.id || value.emoji.name, new Structures.Reaction(this.client, value));
                    }
                    continue;
                case 'content':
                    switch (this.type)
                    {
                        case Constants.MessageTypes.RECIPIENT_ADD:
                            raw[key] = Constants.SystemMessages.RecipientAdd
                                    .replace(/:user:/g, this.author.mention)
                                    .replace(/:user2:/g, this.mentions.first().mention);
                            break;
                        case Constants.MessageTypes.RECIPIENT_REMOVE:
                            const user = cache.mentions.first();
                            if (user && user.id !== cache.author.id) {
                                raw[key] = Constants.SystemMessages.RecipientRemove
                                    .replace(/:user:/g, this.author.mention)
                                    .replace(/:user2:/g, user.mention);
                            } else {
                                raw[key] = Constants.SystemMessages.RecipientRemoveSelf
                                    .replace(/:user:/g, this.author.mention);
                            }
                            break;
                        case Constants.MessageTypes.CALL:
                        raw[key] = Constants.SystemMessages.CallStarted
                                .replace(/:user:/g, this.author.mention);
                            break;
                        case Constants.MessageTypes.CHANNEL_NAME_CHANGE:
                            raw[key] = Constants.SystemMessages.ChannelNameChange
                                .replace(/:user:/g, this.author.mention)
                                .replace(/:name:/g, raw[key]);
                            break;
                        case Constants.MessageTypes.CHANNEL_ICON_CHANGE:
                            raw[key] = Constants.SystemMessages.ChannelIconChange
                                .replace(/:user:/g, this.author.mention);
                            break;
                        case Constants.MessageTypes.CHANNEL_PINNED_MESSAGE:
                            raw[key] = Constants.SystemMessages.PinnedMessage
                                .replace(/:user:/g, this.author.mention);
                            break;
                        case Constants.MessageTypes.GUILD_MEMBER_JOIN:
                            raw[key] = Constants.SystemMessages.GuildMemberJoin[
                                    this.createdAtUnix % Constants.SystemMessages.GuildMemberJoin.length
                                ].replace(/:user:/g, this.author.mention);
                            break;
                    }
                    break;
            }
            Object.defineProperty(this, Utils.Tools.toCamelCase(key), {
                configurable: true,
                enumerable: true,
                writable: false,
                value: raw[key]
            });
        }
    }

    toString()
    {
        return this.id;
    }
}

module.exports = Message;