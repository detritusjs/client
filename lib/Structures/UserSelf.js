const Constants = require('../Utils').Constants;
const User = require('./User.js');

const def = {
    email: null,
    mfa_enabled: false,
    status: Constants.Gateway.STATUS.ONLINE,
    token: null,
    verified: false
};

class UserSelf extends User
{
    constructor(client, raw)
    {
        super(client, Object.assign({}, def, raw));
    }

    get isClaimed()
    {
        return !this.bot && this.email != null;
    }
}

module.exports = UserSelf;