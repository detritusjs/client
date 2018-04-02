class VoiceEncoder
{
	constructor(udp)
	{
		this.udp = udp;
		this.voiceGateway = this.udp.voiceGateway;
	}

	enqueue(buffer)
	{

	}

	enqueueMultiple(buffers)
	{

	}
}

module.exports = VoiceEncoder;