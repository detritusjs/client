class HttpBucket
{
    constructor(route)
    {
        this.route = route;

        this.locked = false;
        this.queue = [];
    }

    get size()
    {
        return this.queue.length;
    }

    get length()
    {
        return this.size;
    }

    lock(unlockIn)
    {
        if (!unlockIn) {
            this.shift();
            return;
        }
        if (this.locked && this.unlockIn) {
            clearTimeout(this.unlockIn);
            this.unlockIn = null;
        }
        this.locked = true;
        this.unlockIn = setTimeout(() => {
            this.locked = false;
            this.shift();
        }, unlockIn);
    }

    add(request, unshift=false)
    {
        if (unshift) {
            this.queue.unshift(request);
        } else {
            this.queue.push(request);
        }
        this.shift();
    }

    shift()
    {
        if (this.locked || !this.size) {return;}

        const request = this.queue.shift();
        request.call().then(request.resolve).catch(request.reject).then(() => {
            this.shift();
        });
        //itll wait for each request before going to the next, maybe fix in future
    }
}

module.exports = HttpBucket;