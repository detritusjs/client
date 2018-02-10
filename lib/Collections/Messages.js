const BaseCollection = require('./BaseCollection.js');
const Utils = require('../Utils');

class Messages extends BaseCollection
{
    constructor(client, options={})
    {
        super();

        Object.defineProperties(this, {
            client: {enumberable: false, writable: false, value: client},
            type: {enumberable: false, writable: true, value: options.type || 'channel'},
            limit: {enumberable: false, writable: true, value: (options.limit === undefined) ? 1000 : options.limit},
            expire: {enumberable: false, writable: true, value: (options.expire === undefined) ? 0 : options.expire}
        });

        if (!Utils.Constants.Detritus.MessageCacheTypes.includes(this.type)) {
            throw new Error(`Invalid Message Cache Type, valid: ${JSON.stringify(Utils.Constants.Detritus.MessageCacheTypes)}`);
        }
    }

    get size()
    {
        var size = 0;
        if (this.type === 'global') {
            size = this._size;
        } else {
            this.forEach((cache) => {
                size += cache._size;
            });
        }
        return size;
    }

    update(message)
    {
        if (!this.limit) {
            return;
        }
        var cache,
            cacheId;
        if (this.type === 'global') {
            cache = this;
        } else {
            if (this.type === 'channel' || message.isDm) {
                cacheId = message.channel_id;
            } else {
                cacheId = message[this.type].id;
            }
            if (!this.has(cacheId, true)) {
                cache = new BaseCollection();
                this._set(cacheId, cache);
            } else {
                cache = this._get(cacheId);
            }
        }
        if (this.limit != -1 && this.limit <= cache.size) {
            const value = cache.values().next().value;
            if (value.expire) {
                clearTimeout(value.expire);
            }
            cache.delete(value.message.id);
        }
        cache._set(message.id, {
            message: message,
            expire: (this.expire) ? setTimeout(() => {
                if (cache.has(message.id)) {
                    cache.delete(message.id);
                }
                if (cacheId && this.has(cacheId)) {
                    if (cache.size === 0) {
                        this.delete(cacheId);
                    }
                }
            }, this.expire * 1000) : null
        });
    }

    clear()
    {
        if (this.type === 'global') {
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

    get(id, cacheId=false)
    {
        if (!this.limit) {
            return;
        }
        if (cacheId || this.type === 'global') {
            if (this.has(id)) {
                if (cacheId) {
                    return this._get(id);
                } else {
                    return this._get(id).message;
                }
            }
        } else {
            for (var cache of this.values()) {
                if (cache.has(id)) {
                    return cache.get(id).message;
                }
            }
        }
    }

    has(id, cacheId=false)
    {
        if (!this.limit) {
            return false;
        }
        if (cacheId || this.type === 'global') {
            return this._has(id);
        } else {
            for (var cache of this.values()) {
                if (cache.has(id)) {
                    return true;
                }
            }
        }
        return false;
    }

    toString()
    {
        return `${this.size} Messages`;
    }
}

module.exports = Messages;