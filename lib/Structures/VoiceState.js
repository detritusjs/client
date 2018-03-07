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
        return this.client.channels.get(this.channelId);
    }

    get guild()
    {
        return this.client.guilds.get(this.guildId);
    }

    get member()
    {
        return this.client.members.get(this.guildId, this.userId);
    }

    get user()
    {
        return this.client.users.get(this.userId);
    }

    deafen(deafen)
    {
        return this.edit({deafen});
    }

    edit(data)
    {
        if (data.channel !== undefined) {
            if (typeof(data.channel) === 'object') {
                data.channel = data.channel.id;
            }
            data.channel_id = data.channel;
        }
        return this.client.rest.endpoints.editMember(this.guildId, this.userId, data);
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