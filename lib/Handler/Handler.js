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
        var Message;
        switch (data.type)
        {
            case Constants.MessageTypes.DEFAULT:                Message = Structures.MessageText; break;
            case Constants.MessageTypes.RECIPIENT_ADD:          Message = Structures.MessageRecipientAdd; break;
            case Constants.MessageTypes.RECIPIENT_REMOVE:       Message = Structures.MessageRecipientRemove; break;
            case Constants.MessageTypes.CALL:                   Message = Structures.MessageCall; break;
            case Constants.MessageTypes.CHANNEL_NAME_CHANGE:    Message = Structures.MessageChannelNameChange; break;
            case Constants.MessageTypes.CHANNEL_ICON_CHANGE:    Message = Structures.MessageChannelIconChange; break;
            case Constants.MessageTypes.CHANNEL_PINNED_MESSAGE: Message = Structures.MessageChannelPinnedMessage; break;
            case Constants.MessageTypes.GUILD_MEMBER_JOIN:      Message = Structures.MessageGuildMemberJoin; break;
        }
        if (!Message) {
            console.error(`Invalid Message Type ${data.type}, ${data}`);
            return;
        }
        const message = new Message(this.client, data);
        this.client.messages.add(message);
        this.client.emit('MESSAGE_CREATE', {message});
    }

    _message_edit(data)
    {
        if (this.client.messages.has(data.id)) {
            const message = this.client.messages.get(data.id).merge(data);
            this.client.messages.add(message);
        } else {
            //idk its not in cache and its probably partial, maybe fetch it from the api?
        }
    }

    _guild_create(data)
    {
        const guild = new Structures.Guild(this.client, data);
        this.client.guilds.add(guild);
        this.client.emit('GUILD_CREATE', {guild});
    }
}

module.exports = Handler;