const Structures = require('../Structures');
const Constants = require('../Utils').Constants;

class Handler
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
            //console.log(packet);
        }
    }

    _ready(data)
    {
        this.client.user = new Structures.UserSelf(this.client, data.user);
        this.client.isBot = this.client.user.bot;
        this.gateway.sessionId = data.session_id;

        //deal with user_settings, shard, relationships, private_channels, presences, guilds

        console.log('ready', data);

        this.client.emit('GATEWAY_READY', {
            raw: data
        });
    }

    _resume(data)
    {
        this.gateway.sessionId = data.session_id;
        this.client.emit('GATEWAY_RESUME', {
            raw: data
        });
    }

    _message_create(data)
    {
        const message = new Structures.Message(this.client, data);
        this.client.messages.update(message);
        this.client.emit('MESSAGE_CREATE', {message});
    }

    _message_update(data)
    {
        if (this.client.messages.has(data.id)) {
            const oldMessage = this.client.messages.get(data.id),
                newMessage = oldMessage.merge(data);
            this.client.messages.update(newMessage);
            this.client.emit('MESSAGE_UPDATE', {oldMessage, newMessage});
        } else {
            //idk its not in cache and its probably partial, maybe fetch it from the api?
        }
    }

    _presence_update(data)
    {
        const presence = new Structures.Presence(this.client, data);
        this.client.presences.update(presence);
        this.client.emit('PRESENCE_UPDATE', {presence});
    }

    _guild_create(data)
    {
        const guild = new Structures.Guild(this.client, data);
        this.client.guilds.update(guild);
        this.client.emit('GUILD_CREATE', {guild});
    }
}

module.exports = Handler;