class Bucket
{
    constructor(route, collection, expireIn=30)
    {
        this.route = route;
        this.collection = collection;

        this.collection.set(route, this);

        this._queue = [];
        this.expire = null;
        this.expireIn = expireIn || 30;
        this.locked = false;

        this.limit = -1;
        this.remaining = -1;
    }

    lock(unlockIn)
    {
        this.locked = true;
        setTimeout(() => {
            this.locked = false;
            this.shift();
        }, unlockIn);
    }

    queue(callback, unshift=false)
    {
        if (unshift) {
            this._queue.unshift(callback);
        } else {
            this._queue.push(callback);
        }
        this.shift();
    }

    shift()
    {
        if (this._queue.length === 0) {
            this.expire = setTimeout(() => {
                this.collection.delete(this.route);
                this.expire = null;
            }, this.expireIn * 1000); //kill bucket in x seconds of no requests coming through here
            return;
        } else {
            if (this.expire) {
                clearTimeout(this.expire);
                this.expire = null;
            }
            if (!this.collection.has(this.route)) {
                this.collection.set(this.route, this); //incase it got deleted during the request lol
            }
        }
        if (this.locked) {
            return;
        }

        this._queue.shift()(() => {
            this.shift();
        });
        //use the headers
    }
}

module.exports = Bucket;