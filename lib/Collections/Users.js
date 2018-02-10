const BaseCollection = require('./BaseCollection.js');
const Utils = require('../Utils');

class Users extends BaseCollection
{
    constructor(client, options={})
    {
        super();
        Object.defineProperties(this, {
            client: {enumberable: false, writable: true, value: client},
            enabled: {enumberable: false, writable: true, value: (options.enabled === undefined) ? true : options.enabled},
            expireWhenOffline: {enumberable : false, writable: true, value: !!(options.expireWhenOffline || false)}
        });
    }

    update(user)
    {
        if (!this.enabled) {
            return;
        }
        this._set(user.id, user);
    }
    
    fetch(id)
    {
        //get from rest api
    }

    toString()
    {
        return `${this.size} Users`;
    }
}

module.exports = Users;