const BaseCollection = require('./BaseCollection.js');
const Utils = require('../Utils');

class Messages extends BaseCollection
{
    constructor(client, options={})
    {
        super();
        options = options || {};
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
        return (this.type === 'global') ? super.size : this.reduce((size, cache) => {
            return size + cache.size;
        });
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
                cacheId = message.channelId;
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
            const value = cache.first();
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

    get(id, cacheId)
    {
        if (!this.limit) {
            return null;
        }
        if (this.type === 'global' || cacheId) {
            var cache;
            if (cacheId) {
                cache = super.get(cacheId);
            } else {
                cache = this;
            }
            const value = (cache) ? cache.get(id) : null;
            return value && value.message;
        } else {
            for (let cache of this.values()) {
                if (cache.has(id)) {
                    return cache.get(id).message;
                }
            }
        }
        return null;
    }

    has(id, cacheId)
    {
        if (!this.limit) {
            return false;
        }
        if (this.type === 'global' || cacheId) {
            var cache;
            if (cacheId) {
                cache = super.get(cacheId);
            } else {
                cache = this;
            }
            return (cache) ? cache.has(id) : false;
        } else {
            for (let cache of this.values()) {
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