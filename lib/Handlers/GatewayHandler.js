const BaseCollection = require('../Collections/BaseCollection.js');

const Structures = require('../Structures');
const Constants = require('../Utils').Constants;

class GatewayHandler
{
    constructor(gateway)
    {
        this.gateway = gateway;
        this.client = this.gateway.client;
    }

    event(packet)
    {
        const handle = this[`_${packet.t.toLowerCase()}`];
        if (handle) {
            handle.call(this, packet.d);
        } else {
            console.log('UNKNOWN PACKET', packet);
        }
    }

    _ready(data)
    {
        this.gateway.sessionId = data.session_id;
        this.gateway.discordTrace = data._trace;
        this.client.user = new Structures.UserSelf(this.client, data.user);
        this.client.isBot = this.client.user.bot;
        this.client.users.update(this.client.user);

        data.private_channels.forEach((data) => {
            if (!this.client.channels.enabled) {
                return;
            }
            var Channel;
            switch (data.type)
            {
                case Constants.ChannelTypes.DM:       Channel = Structures.ChannelDM; break;
                case Constants.ChannelTypes.GROUP_DM: Channel = Structures.ChannelDMGroup; break;
            }
            if (!Channel) {
                console.error(`Invalid Channel Type ${data.type}, ${data}`);
                return;
            }
            this.client.channels.update(new Channel(this.client, data));
        });

        data.guilds.forEach((guild) => {
            this.client.guilds.update(new Structures.Guild(this.client, guild));
        });

        data.relationships.forEach((relationship) => {

        });

        data.presences.forEach((presence) => {

        });

        //data.user_settings is {}

        this.client.emit('GATEWAY_READY', {
            raw: data
        });
    }

    _resumed(data)
    {
        this.gateway.discordTrace = data._trace;
        this.client.emit('GATEWAY_RESUMED', {
            raw: data
        });
    }

    _channel_create(data)
    {
        var Channel;
        switch (data.type)
        {
            case Constants.ChannelTypes.GUILD_TEXT:     Channel = Structures.ChannelText; break;
            case Constants.ChannelTypes.DM:             Channel = Structures.ChannelDM; break;
            case Constants.ChannelTypes.GUILD_VOICE:    Channel = Structures.ChannelVoice; break;
            case Constants.ChannelTypes.GROUP_DM:       Channel = Structures.ChannelDMGroup; break;
            case Constants.ChannelTypes.GUILD_CATEGORY: Channel = Structures.ChannelCategory; break;
        }
        if (!Channel) {
            console.error(`Invalid Channel Type ${data.type}, ${data}`);
            return;
        }

        const payload = {
            channel: new Channel(this.client, data)
        };
        this.client.channels.update(payload.channel);
        this.client.emit('CHANNEL_CREATE', payload);
    }

    _channel_update(data)
    {
        const payload = {
            old: null,
            new: null
        };
        if (this.client.channels.has(data.id)) {
            payload.new = this.client.channels.get(data.id);
            payload.old = payload.new.clone();
            payload.new.merge(data);
        } else {
            var Channel;
            switch (data.type)
            {
                case Constants.ChannelTypes.GUILD_TEXT:     Channel = Structures.ChannelText; break;
                case Constants.ChannelTypes.DM:             Channel = Structures.ChannelDM; break;
                case Constants.ChannelTypes.GUILD_VOICE:    Channel = Structures.ChannelVoice; break;
                case Constants.ChannelTypes.GROUP_DM:       Channel = Structures.ChannelDMGroup; break;
                case Constants.ChannelTypes.GUILD_CATEGORY: Channel = Structures.ChannelCategory; break;
            }
            if (!Channel) {
                console.error(`Invalid Channel Type ${data.type}, ${data}`);
                return;
            }
            
            payload.new = new Channel(this.client, data);
            this.client.channels.update(payload.new);
        }
        this.client.emit('CHANNEL_UPDATE', payload);
    }

    _channel_delete(data)
    {
        const payload = {
            channel: null,
            channelId: data.id,
            raw: data
        };

        if (this.client.channels.has(data.id)) {
            payload.channel = this.client.channels.get(data.id).clone();
            this.client.channels.delete(data.id);
        }

        this.client.emit('CHANNEL_DELETE', payload);
    }

    _channel_pins_update(data)
    {
        const payload = {
            channel: null,
            raw: data
        };
        if (this.client.channels.has(data.channel_id)) {
            payload.channel = this.client.channels.get(data.channel_id);
            payload.channel.merge({
                last_pin_timestamp: data.last_pin_timestamp
            });
        }
        
        this.client.emit('CHANNEL_PINS_UPDATE', payload);
    }

    _guild_ban_add(data)
    {
        const payload = {
            user: null,
            guild: null
        };
        if (this.client.guilds.has(data.guild_id)) {
            payload.guild = this.client.guilds.get(data.guild_id);
        } else {
            payload.guild = {id: data.guild_id};
        }

        if (this.client.users.has(data.id)) {
            payload.user = this.client.users.get(data.id);
        } else {
            payload.user = {id: data.id};
        }
        //add into the guild?
        this.client.emit('GUILD_BAN_ADD', payload);
    }

    _guild_ban_remove(data)
    {
        const payload = {
            user: null,
            guild: null
        };
        if (this.client.guilds.has(data.guild_id)) {
            payload.guild = this.client.guilds.get(data.guild_id);
        } else {
            payload.guild = {id: data.guild_id};
        }

        if (this.client.users.has(data.id)) {
            payload.user = this.client.users.get(data.id);
        } else {
            payload.user = {id: data.id};
        }
        //remove from guild?
        this.client.emit('GUILD_BAN_REMOVE', payload);
    }

    _guild_create(data)
    {
        const payload = {
            guild: null,
            fromUnavailable: false
        };

        if (this.client.guilds.has(data.id)) {
            payload.guild = this.client.guilds.get(data.id);
            payload.fromUnavailable = payload.guild.unavailable;
            payload.guild.merge(data);
        } else {
            payload.guild = new Structures.Guild(this.client, data);
            this.client.guilds.update(guild);
        }
        this.client.emit('GUILD_CREATE', payload);
    }

    _guild_delete(data)
    {
        const payload = {
            guild: this.client.guilds.get(data.id),
            guildId: data.id,
            isUnavailable: Object.keys(data).includes('unavailable')
        };

        if (data.isUnavailable) {
            if (payload.guild) {
                payload.guild.merge(data);
            } else {
                payload.guild = new Structures.Guild(this.client, data);
                this.client.guilds.update(payload.guild);
            }
        } else {
            this.client.guilds.delete(data.id);
        }
        this.client.emit('GUILD_DELETE', payload);
    }

    _guild_emojis_update(data)
    {
        const payload = {
            guild: this.client.guilds.get(data.guild_id),
            guildId: data.guild_id,
            old: null,
            new: new BaseCollection()
        };
        if (payload.guild) {
            payload.old = new BaseCollection();
            payload.guild.emojis.forEach((emoji) => {
                payload.old.set(emoji.id, emoji.clone());
                if (!data.emojis.some((e) => e.id === emoji.id)) {
                    this.client.emojis.delete(emoji.id);
                }
            });
        }
        data.emojis.forEach((emoji) => {
            const e = new Structures.Emoji(this.client, Object.assign(emoji, {guild_id: data.guild_id}));
            this.client.emojis.update(e);
            payload.new.set(e.id, e);
        });
        this.client.emit('GUILD_EMOJIS_UPDATE', payload);
    }

    _guild_integrations_update(data)
    {
        console.log('guild_integrations_update', data);
    }

    _guild_member_add(data)
    {
        const member = new Structures.Member(this.client, data);
        this.client.members.update(member);
        this.client.emit('GUILD_MEMBER_ADD', {member});
    }

    _guild_member_remove(data)
    {
        const payload = {
            guildId: data.guild_id
        };
        if (this.client.members.has(data.guild_id, data.user.id)) {
            this.client.members.delete(data.guild_id, data.user.id);
        }
        if (!this.client.members.enabled || this.client.members.has(null, data.user.id)) {
            if (this.client.users.has(data.user.id)) {
                payload.user = this.client.users.get(data.user.id);
            } else {
                payload.user = new Structures.User(this.client, data.user);
                this.client.users.update(payload.user);
            }
            payload.inCache = true;

            //might be a memory leak for people who have members disabled
        } else {
            if (this.client.users.has(data.user.id)) {
                this.client.users.delete(data.user.id);
            }
            payload.user = new Structures.User(this.client, data.user);
            payload.inCache = false;
        }
        this.client.emit('GUILD_MEMBER_REMOVE', payload);
    }

    _guild_member_update(data)
    {
        const payload = {
            old: null,
            new: null
        };
        if (this.client.members.has(data.guild_id, data.user.id)) {
            payload.new = this.client.members.get(data.guild_id, data.user.id);
            payload.old = payload.new.clone();
            payload.new.merge(data);
        } else {
            payload.new = new Structures.Member(this.client, data);
            this.client.members.update(payload.new);
        }
        this.client.emit('GUILD_MEMBER_UPDATE', payload);
    }

    _guild_members_chunk(data)
    {
        if (!this.client.members.enabled) {
            return;
        }
        data.members.forEach((member) => {
            if (this.client.members.has(data.guild_id, member.user.id)) {
                this.client.members.get(data.guild_id, member.user.id).merge(member);
            } else {
                this.client.members.update(new Structures.Member(this.client, Object.assign(member, {guild_id: data.guild_id})));
            }
        });
    }

    _guild_role_create(data)
    {
        const payload = {
            guild: this.client.guilds.get(data.guild_id),
            guildId: data.guild_id,
            role: new Structures.Role(this.client, data.role)
        };
        if (payload.guild) {
            payload.guild.roles.set(payload.role.id, payload.role);
        }
        this.client.emit('GUILD_ROLE_CREATE', payload);
    }

    _guild_role_delete(data)
    {
        const payload = {
            guild: this.client.guilds.get(data.guild_id),
            guildId: data.guild_id,
            role: null,
            roleId: data.role_id
        };
        if (payload.guild) {
            payload.role = payload.guild.roles.get(data.guild_id, data.role_id).clone();
            payload.guild.roles.delete(data.guild_id, data.role_id);
        }
        this.client.emit('GUILD_ROLE_DELETE', payload);
    }

    _guild_role_update(data)
    {
        const payload = {
            guild: this.client.guilds.get(data.guild_id),
            guildId: data.guild_id,
            old: null,
            new: null
        };
        if (payload.guild) {
            if (payload.guild.roles.has(data.role.id)) {
                payload.new = payload.guild.roles.get(data.role.id);
                payload.old = payload.new.clone();
                payload.new.merge(data.role);
            } else {
                payload.new = new Structures.Role(this.client, Object.assign(data.role, {guild_id: data.guild_id}));
                guild.roles.set(payload.new.id, payload.new);
            }
        } else {
            payload.new = new Structures.Role(this.client, Object.assign(data.role, {guild_id: data.guild_id}));
        }
        this.client.emit('GUILD_ROLE_UPDATE', payload);
    }

    _guild_update(data)
    {
        const payload = {
            old: null,
            new: null
        };
        if (this.client.guilds.has(data.id)) {
            payload.new = this.client.guilds.get(data.id);
            payload.old = payload.new.clone();
            payload.new.merge(data);
        } else {
            payload.new = new Structures.Guild(this.client, data);
            this.client.guilds.update(payload.new);
        }
        this.client.emit('GUILD_UPDATE', payload);
    }

    _message_create(data)
    {
        const message = new Structures.Message(this.client, data);
        this.client.messages.update(message);
        this.client.emit('MESSAGE_CREATE', {message});
    }

    _message_delete(data)
    {
        const payload = {
            id: data.id,
            channelId: data.channel_id,
            old: null
        };
        if (this.client.messages.has(data.id)) {
            payload.old = this.client.messages.get(data.id).clone();
            this.client.messages.delete(data.id);
        }
        this.client.emit('MESSAGE_DELETE', payload);
    }

    _message_delete_bulk(data)
    {
        const payload = {
            messages: [],
            channelId: data.channel_id
        };
        data.ids.forEach((messageId) => {
            const p = {
                id: messageId,
                old: null
            };
            if (this.client.messages.has(messageId)) {
                p.old = this.client.messages.get(messageId).clone();
                this.client.messages.delete(messageId);
            }
            payload.messages.push(p);
        });
        this.client.emit('MESSAGE_DELETE_BULK', payload);
    }

    _message_reaction_add(data)
    {
        console.log('message_reaction_add', data);
    }

    _message_reaction_remove(data)
    {
        console.log('message_reaction_remove', data);
    }

    _message_reaction_remove_all(data)
    {
        console.log('message_reaction_remove_all', data);
    }

    _message_update(data)
    {
        const payload = {
            old: null,
            new: null
        };
        if (this.client.messages.has(data.id)) {
            payload.new = this.client.messages.get(data.id);
            payload.old = payload.new.clone();
            payload.new.merge(data);
        } else {
            payload.new = new Structures.Message(this.client, data);
            //idk its not in cache and its probably partial, maybe fetch it from the api?
        }
        this.client.emit('MESSAGE_UPDATE', payload);
    }

    _presence_update(data)
    {
        const payload = {
            old: this.client.presences.get(data.guild_id, data.user.id),
            new: new Structures.Presence(this.client, data)
        };
        if (payload.old) {
            payload.old = payload.old.clone();
        }
        this.client.presences.update(payload.new);
        this.client.emit('PRESENCE_UPDATE', payload);
    }

    _typing_start(data)
    {
        //finished?
        this.client.emit('TYPING_START', {
            user: this.client.users.get(data.user_id) || {id: data.user_id},
            channel: this.client.channels.get(data.channel_id) || {id: data.channel_id},
            timestamp: data.timestamp
        });
    }

    _user_update(data)
    {
        const payload = {
            old: null,
            new: null
        };
        if (this.client.users.has(data.id)) {
            payload.new = this.client.user.get(data.id);
            payload.old = payload.new.clone();
            payload.new.merge(data);
        } else {
            payload.new = new Structures.User(this.client, data);
            this.client.users.update(payload.new);
        }
        this.client.emit('USER_UPDATE', payload);
    }

    _voice_state_update(data)
    {
        const payload = {
            old: null,
            new: null,
            leftChannel: false
        };
        if (this.client.voiceStates.has(data.guild_id, data.user_id)) {
            payload.new = this.client.voiceStates.get(data.guild_id, data.user_id);
            payload.old = payload.new.clone();
            payload.new.merge(data);
            if (!data.channel_id) {
                payload.new = payload.new.clone();
                this.client.voiceStates.delete(data.guild_id, data.user_id);
                payload.leftChannel = true;
            }
        } else {
            payload.new = new Structures.VoiceState(this.client, data);
            this.client.voiceStates.update(payload.new);
        }
        this.client.emit('VOICE_STATE_UPDATE', payload);
    }

    _voice_server_update(data)
    {
        console.log('voice_server_update', data);
    }
}

module.exports = GatewayHandler;