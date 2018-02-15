const BaseStructure = require('./BaseStructure.js');

const Utils = require('../Utils');
const Constants = Utils.Constants;

const def = {
    activity: {},
    application: {},
    attachments: [],
    author: {},
    call: {},
    channel_id: null,
    content: '',
    edited_timestamp: null,
    embeds: [],
    id: null,
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
        super(client, Object.assign({}, def, raw));
    }

    get author()
    {
        return this._client.users.get(this._author.id);
    }

    get channel()
    {
        return this._client.channels.get(this.channel_id);
    }

    get content()
    {
        switch (this.type)
        {
            case Constants.MessageTypes.DEFAULT:
                return this.raw.content;
                break;
            case Constants.MessageTypes.RECIPIENT_ADD:
                return `<@${this.raw.author.id}> added <@${this.raw.mentions[0].id}> to the group.`;
                break;
            case Constants.MessageTypes.RECIPIENT_REMOVE:
                return `<@${this.raw.mentions[0].id}> left the group.`;
                break;
            case Constants.MessageTypes.CALL:
                return `<@${this.raw.author.id}> started a call.`;
                break;
            case Constants.MessageTypes.CHANNEL_NAME_CHANGE:
                return `<@${this.raw.author.id}> changed the channel name: ${this.raw.content}`;
                break;
            case Constants.MessageTypes.CHANNEL_ICON_CHANGE:
                return `<@${this.raw.author.id}> changed the channel icon.`;
                break;
            case Constants.MessageTypes.CHANNEL_PINNED_MESSAGE:
                return `<@${this.raw.author.id}> pinned a message to this channel.`;
                break;
            case Constants.MessageTypes.GUILD_MEMBER_JOIN:
                //get it from the timestamp modulo joinmessagelength
                break;
            default:
                return this.raw.content;
        }
    }

    get fromSystem()
    {
        return this.type !== Constants.MessageTypes.DEFAULT;
    }

    get fromWebhook()
    {
        return !!this.webhook_id;
    }
    
    get guild()
    {
        const channel = this.channel;
        if (channel && !channel.isDm) {
            return this._client.guilds.get(channel.guild_id);
        }
    }

    get isDm()
    {
        const channel = this.channel;
        return (channel) ? channel.isDm : null;
    }

    get mentions()
    {
        return this.raw.mentions.map((user) => {
            if (this._client.users.has(user.id)) {
                return this._client.users.get(user.id);
            } else {
                user = User(this._client, user);
                this._client.users.update(user);
            }
        });
    }

    get mentionRoles()
    {
        const guild = this.guild;
        if (!guild) {
            return this.raw.mention_roles;
        } else {
            return this.raw.mention_roles.map((role) => {

            });
        }
    }

    toString()
    {
        return this.id;
    }
}

module.exports = Message;