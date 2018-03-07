const BaseCollection = require('./BaseCollection.js');

class Buckets extends BaseCollection
{
    constructor(options)
    {
        super();
        options = options || {};
        Object.defineProperties(this, {
            expireIn: {enumberable: false, writable: true, value: (options.expireIn === undefined) ? 0 : options.expireIn}
        });
    }

    add(bucket)
    {
        this.set(bucket.route, {
            bucket,
            expire: (this.expireIn) ? setTimeout(() => {this.delete(bucket.route);}, this.expireIn) : null
        });
    }

    expire(bucket)
    {
        if (!this.expireIn) {return;}
        if (!this.has(bucket.route)) {return;}
        const b = this.get(bucket.route);
        if (b.expire) {return;}
        b.expire = setTimeout(() => {
            this.delete(bucket.route);
        }, this.expireIn);
    }

    stopExpire(bucket)
    {
        if (!this.expireIn) {return;}
        if (this.has(bucket.route)) {
            const b = this.get(bucket.route);
            if (!b.expire) {return;}
            clearTimeout(b.expire);
            b.expire = null;
        } else {
            this.add(bucket);
        }
    }
}

module.exports = Buckets;