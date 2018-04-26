class HttpBucket
{
	constructor(route)
	{
		this.route = route;

		this.locked = false;
		this.queue = [];
		
		this.ratelimit = {};
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
			return this.shift();
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

	add(delayed, unshift=false)
	{
		if (unshift) {
			this.queue.unshift(delayed);
		} else {
			this.queue.push(delayed);
		}
		this.shift();
	}

	shift()
	{
		if (this.locked || !this.size) {return;}

		const delayed = this.queue.shift();
		delayed.request.send().then(delayed.resolve).catch(delayed.reject).then(this.shift.bind(this));
		//itll wait for each request before going to the next, maybe fix in future
	}
}

module.exports = HttpBucket;