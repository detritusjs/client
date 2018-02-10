const BaseStructure = require('./BaseStructure.js');

const Utils = require('../Utils');
const Constants = Utils.Constants;

const def = {
    attachments: [],
    author: {},
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

    get fromSystem()
    {
        return this.type !== Constants.MessageTypes.DEFAULT;
    }

    get fromWebhook()
    {
        return !!this.webhook_id;
    }

    get channel()
    {
        return this._client.channels.get(this.channel_id);
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
        return this._mentions.map((user) => {
            if (this._client.users.has(user.id)) {
                return this._client.users.get(user.id);
            } else {
                user = User(this._client, user);
                this._client.users.add(user);
            }
        });
    }

    get mentionRoles()
    {
        const guild = this.guild;
        if (!guild) {
            return this._mention_roles;
        } else {
            return this._mention_roles.map((role) => {

            });
        }
    }

    toString()
    {
        return this.id;
    }
}

module.exports = Message;