'use strict';

const BaseCollection = require('./BaseCollection.js');

class OpusObjects extends BaseCollection
{
    constructor(client, options={})
    {
        super();
        options = options || {};
        Object.defineProperties(this, {
            client: {enumberable: false, writable: false, value: client}
        });
	}
	
	format(sampleRate, channels, application)
	{
		return `${parseInt(sampleRate)}.${parseInt(channels)}.${parseInt(application)}`; //parseint incase someone passes in a float lol
	}

    update(opusObject)
    {
		const key = this.format(opusObject.sampleRate, opusObject.channels, opusObject.application);

		if (super.has(key)) {
			super.get(key).opus.delete();
		}

		super.set(key, opusObject);
	}
	
	has(sampleRate, channels, application)
	{
		const key = this.format(sampleRate, channels, application);
		return super.has(key);
	}

	get(sampleRate, channels, application)
	{
		const key = this.format(sampleRate, channels, application);
		return super.get(key);
	}

	set(sampleRate, channels, application, opusObject)
	{
		const key = this.format(sampleRate, channels, application);
		return super.set(key, opusObject);
		//maybe cache how many uses, if it drops below one on delete, itll delete the object
	}

	delete(sampleRate, channels, application)
	{
		const key = this.format(sampleRate, channels, application);
		return super.delete(key);
	}

    toString()
    {
        return `${this.size} OpusObjects`;
    }
}

module.exports = OpusObjects;