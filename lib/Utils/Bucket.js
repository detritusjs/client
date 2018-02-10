class Bucket
{
    constructor()
    {
        this._queue = [];
        this.expire = null;
        this.locked = false;
    }

    lock(unlockIn)
    {
        this.locked = true;
        setTimeout(() => {
            this.locked = false;
        }, unlockIn);
    }

    queue(callback)
    {
        this._queue.push(callback);
        this.shift();
    }

    shift()
    {
        if (this.locked || this._queue.length === 0) {
            return;
        }

        
    }
}

module.exports = Bucket;