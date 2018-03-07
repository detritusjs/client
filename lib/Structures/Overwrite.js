const BaseStructure = require('./BaseStructure.js');

const Utils = require('../Utils');
const Constants = Utils.Constants;

const def = {
    id: null,
    allow: 0,
    channel_id: null,
    deny: 0,
    guild_id: null,
    type: null
};

class Overwrite extends BaseStructure
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

    get isMember()
    {
        return this.type === 'member';
    }

    get isRole()
    {
        return this.type === 'role';
    }

    get member()
    {
        if (!this.isMember) {return;}
        const guild = this.guild;
        if (guild && guild.members.has(this.id)) {
            return guild.members.get(this.id);
        }
    }

    get role()
    {
        if (!this.isRole) {return;}
        const guild = this.guild;
        if (guild && guild.roles.has(this.id)) {
            return guild.roles.get(this.id);
        }
    }
}

module.exports = Overwrite;