const Crypto = require('crypto');

const BaseStructure = require('./BaseStructure.js');
const Structures = require('./index.js');

const Utils = require('../Utils');
const Constants = Utils.Constants;

const def = {
    game: null,
    status: ''
};

class Presence extends BaseStructure
{
    constructor(client, raw)
    {
        const cache = {};
        for (let key in def) {
            cache[key] = raw[key] || def[key];
        }

        if (cache.game && !Object.keys(cache.game).length) {
            cache.game = null;
        }

        super(client, cache);
        this.merge();
    }

    equals(presence)
    {
        return this.hash === presence.hash;
    }

    merge(raw={})
    {
        if (Object.keys(raw).length) {
            for (let key in def) {
                if (!(key in raw)) {continue;}
                Object.defineProperty(this, Utils.Tools.toCamelCase(key), {
                    configurable: true,
                    enumerable: true,
                    writable: false,
                    value: raw[key]
                });
            }
        }
        this.hash = Crypto.createHash('md5').update(this.toString()).digest('hex');
    }

    toString()
    {
        return [
            'PRESENCE',
            this.status,
            this.game && JSON.stringify(this.game)
        ].filter((v)=>v).join('.');
    }
}

module.exports = Presence;