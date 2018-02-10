const BaseCollection = require('./BaseCollection.js');
const Utils = require('../Utils');

class Users extends BaseCollection
{
    constructor(client, options={})
    {
        super();
        this.client = client;
        this.options = {
            enabled: (options.enabled === undefined) ? true : options.enabled,
            expireWhenOffline: options.expireWhenOffline || false
        };
    }

    add(user)
    {
        if (!this.options.enabled) {
            return;
        }
        this.set(user.id, user);
    }

    get(id)
    {
        return new Promise((resolve, reject) => {
            if (this.has(id)) {
                resolve(super.get(id));
                return;
            } else {
                //get from rest api
            }
        });
    }
}

module.exports = Users;