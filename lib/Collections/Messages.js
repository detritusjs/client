const BaseCollection = require('./BaseCollection.js');
const Utils = require('../Utils');

class Messages extends BaseCollection
{
    constructor(client, options={})
    {
        super();
        this.client = client;
        this.options = {
            type: options.type || 'channel',
            limit: (options.limit === undefined) ? 1000 : options.limit,
            expire: (options.expire === undefined) ? 0 : options.expire
        };

        if (!Utils.Constants.Detritus.MessageCacheTypes.includes(this.options.type)) {
            throw new Error(`Invalid Message Cache Type, valid: ${JSON.stringify(Utils.Constants.Detritus.MessageCacheTypes)}`);
        }
    }

    get size()
    {
        var size = 0;
        if (this.options.type === 'global') {
            size = this.size;
        } else {
            this.forEach((cache) => {
                size += cache.size;
            });
        }
        return size;
    }

    add(message)
    {
        if (!this.options.limit) {
            return;
        }
        var cache,
            cacheId;
        if (this.options.type === 'global') {
            cache = this;
        } else {
            if (this.options.type === 'channel' || message.isDm) {
                cacheId = message.channel_id;
            } else {
                cacheId = message[this.options.type].id;
            }
            if (!this.has(cacheId)) {
                cache = new BaseCollection();
                this.set(cacheId, cache);
            } else {
                cache = super.get(cacheId);
            }
        }
        if (this.options.limit != -1 && this.options.limit <= cache.size) {
            const value = cache.values().next().value;
            if (value.expire) {
                clearTimeout(value.expire);
            }
            cache.delete(value.message.id);
        }
        cache.set(message.id, {
            message: message,
            expire: (this.options.expire) ? setTimeout(() => {
                if (cache.has(message.id)) {
                    cache.delete(message.id);
                }
                if (cacheId && this.has(cacheId)) {
                    if (super.get(cacheId).size === 0) {
                        this.delete(cacheId);
                    }
                }
            }, this.options.expire * 1000) : null
        });
    }

    clear()
    {
        if (this.options.type === 'global') {
            this.forEach((value, id) => {
                if (value.expire) {
                    clearTimeout(value.expire);
                }
                this.delete(id);
            });
        } else {
            this.forEach((cache, cacheId) => {
                cache.forEach((value, id) => {
                    if (value.expire) {
                        clearTimeout(value.expire);
                    }
                    cache.delete(id);
                });
                this.delete(cacheId);
            });
        }
    }

    fetch(id, channelId)
    {
        //get from rest api
    }

    get(id)
    {
        if (!this.options.limit) {
            return;
        }
        if (this.options.type === 'global') {
            if (this.cache.has(id)) {
                return this.cache.get(id).message;
            }
        } else {
            for (var cache of this.values()) {
                if (cache.has(id)) {
                    return cache.get(id).message;
                }
            }
        }
    }

    has(id)
    {
        if (!this.options.limit) {
            return false;
        }
        if (this.options.type === 'global') {
            return this.cache.has(id);
        } else {
            for (var cache of this.values()) {
                if (cache.has(id)) {
                    return true;
                }
            }
        }
        return false;
    }

}

module.exports = Messages;