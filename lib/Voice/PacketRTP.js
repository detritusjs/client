const MAX = require('../Utils').Constants.MAX;

class PacketRTP
{
	constructor(packet)
	{
		this.buffer = packet;
		this.header = this.buffer.slice(0, 24);

		this.nonce = null;
		this.data = null;
	}

	decode(mode)
	{
		switch (mode) {
			case 'xsalsa20_poly1305_lite': {
				this.nonce = this.buffer.slice(-24);
				this.data = this.buffer.slice(24, -24);
			}; break;
			case 'xsalsa20_poly1305_suffix': {
				this.nonce = this.buffer.slice(-24);
				this.data = this.buffer.slice(24, -24);
			}; break;
			case 'xsalsa20_poly1305': {
				this.nonce = this.header;
				this.data = this.buffer.slice(24);
			}; break;
			default: {
				throw new Error(`${this.mode} is not supported for decoding.`);
			};
		}
	}
}

module.exports = PacketRTP;