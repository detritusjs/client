const BaseStructure = require('./BaseStructure.js');
const User = require('./User.js');

const Utils = require('../Utils');
const Constants = Utils.Constants;

const def = {
    channel_id: null,
    deaf: false,
    guild_id: null,
    mute: false,
    self_deaf: false,
    self_mute: false,
    self_video: false,
    session_id: null,
    suppress: false,
    user_id: null
};

class VoiceState extends BaseStructure
{
    constructor(client, raw)
    {
        super(client, Object.assign({}, def, raw));
    }

    get channel()
    {
        return this._client.channels.get(this.channelId);
    }

    get guild()
    {
        return this._client.guilds.get(this.guildId);
    }

    get member()
    {
        return this._client.members.get(this.guildId, this.userId);
    }

    get user()
    {
        return this._client.users.get(this.userId);
    }

    deafen(deafen)
    {
        return this.edit({deafen});
    }

    edit(options)
    {
        const payload = {};

        if (options.channel !== undefined) {
            if (typeof(options.channel) === 'object') {
                options.channel = options.channel.id;
            }
            payload.channel_id = options.channel;
        }
        if (options.deafen !== undefined) {
            payload.deafen = !!options.deafen;
        }
        if (options.mute !== undefined) {
            payload.mute = !!options.mute;
        }

        return this._client.rest.request({
            route: {
                method: 'PATCH',
                path: Constants.Endpoints.REST.GUILDS.MEMBER,
                params: {
                    guildId: this.guildId,
                    userId: this.userId
                }
            },
            body: payload,
            json: true
        });
    }

    move(channel)
    {
        return this.edit({channel});
    }

    mute(mute)
    {
        return this.edit({mute});
    }
}

module.exports = VoiceState;