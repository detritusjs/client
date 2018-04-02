const OpusApplication = require('../Utils').Constants.Opus;

const Opus = {
	available: {},
	modules: ['node-opus', 'opusscript']
};

for (let mod of Opus.modules) {
	try {
		Opus.available[mod] = require(mod);
	} catch (e) {continue;}
}

//implement sort of a caching system so we dont create a new opus thing for every encoder and decoder pair, even reuse the same opus for multiple calls

class AudioOpus
{
	constructor(sampleRate, channels, application, mod)
	{
		this.mod = null;
		this.opus = null;

		this.sampleRate = sampleRate;
		this.channels = channels;
		this.application = application || OpusApplication.AUDIO;

		this.setMod(mod);
	}

	get module()
	{
		if (!this.mod) {throw new Error('Module missing, cannot opus encode/decode.');}
		return Opus.available[this.mod];
	}

	setMod(mod)
	{
		if (!mod) {
			throw new Error(`For opus encoding/decoding, please install one of: ${JSON.stringify(PCrypto.modules)}`);
		}
		if (!Opus.modules.includes(mod)) {
			throw new Error(`Invalid module '${mod}', please use one of: ${JSON.stringify(PCrypto.modules)}`);
		}
		if (!(mod in Opus.available)) {
			throw new Error(`Module '${mod} is not installed, use one of: ${JSON.stringify(PCrypto.modules)}`);
		}
		this.mod = mod;

		if (this.opus) {this.delete();}
		switch(this.mod) {
			case 'node-opus': {
				this.opus = new this.module.OpusEncoder(this.sampleRate, this.channels, this.application);
			}; break;
			case 'opusscript': {
				this.opus = new this.module(this.sampleRate, this.channels, this.application);
			}; break;
		}
	}

	encode(buf, frameDuration)
	{
		if (!this.opus) {throw new Error('Object was deleted, reinitialize with setMod');}

		const frameSize = (this.sampleRate / 1000) * frameDuration;

		let packet;
		switch(this.mod) {
			case 'node-opus': {
				packet = this.opus.encode(buf, frameSize);
			}; break;
			case 'opusscript': {
				packet = this.opus.encode(buf, frameSize);
			}; break;
		}
		return packet;
	}

	decode(buf, frameDuration)
	{
		if (!this.opus) {throw new Error('Object was deleted, reinitialize with setMod');}

		const frameSize = (this.sampleRate / 1000) * frameDuration;

		let packet;
		switch(this.mod) {
			case 'node-opus': {
				packet = this.opus.decode(buf, frameSize);
			}; break;
			case 'opusscript': {
				packet = this.opus.decode(buf, frameSize);
			}; break;
		}
		return packet;
	}

	delete()
	{
		this.opus.delete();
		this.opus = null;
	}
}

module.exports = AudioOpus;