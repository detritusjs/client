class Bucket
{
    constructor(expireIn=30)
    {
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
        if (this.locked || this._queue.length === 0) {
            this.expire = setTimeout(() => {
                //idk how to kill bucket yet lol
            }, this.expireIn * 1000); //kill bucket in 30 seconds of no requests coming through here
            return;
        }

        this._queue.shift()(() => {
            this.shift();
        });
        //use the headers
    }
}

module.exports = Bucket;