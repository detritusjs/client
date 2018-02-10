const Channel = require('./Channel.js');
const User = require('./User.js');

const Utils = require('../Utils');
const Constants = Utils.Constants;

const def = {
    last_message_id: null,
    recipients: []
};

class ChannelDM extends Channel
{
    constructor(client, raw)
    {
        super(client, Object.assign({}, def, raw));
        this._recipients = this._recipients.map((user) => {
            if (!this._client.users.has(user.id)) {
                this._client.users.add(new User(this._client, user));
            }
            return user.id;
        });
    }

    get recipients()
    {
        return this._recipients.map((id) => {
            return this._client.users.get(id);
        });
    }

    iconURL(format)
    {
        return (this.recipients.length) ? this.recipients[0].avatarURL(format) : null;
    }
}

module.exports = ChannelDM;