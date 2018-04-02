const MAX = require('../Utils').Constants.MAX;

class PacketRTPHeader
{
    constructor(type, version)
    {
        this.buffer = Buffer.alloc(24);
        this.buffer[0] = type;
        this.buffer[1] = version;

        this.nonce = {
			number: 0,
			buffer: Buffer.alloc(24)
		};

        this.sequence = 0;
        this.timestamp = 0;
        this.ssrc = 0;
    }

    setNonce(nonce, add)
    {
		if (nonce === undefined) {
			nonce = 1;
			add = true;
		}
        if (add) {
            this.nonce.number = (this.nonce.number + nonce) % MAX.UINT32;
        } else {
            this.nonce.number = nonce % MAX.UINT32;
		}

		this.nonce.buffer.writeUIntBE(this.nonce.number, 0, 4);
    }

    setSequence(sequence, add)
    {
		if (sequence === undefined) {
			sequence = 1;
			add = true;
		}
        if (add) {
            this.sequence = (this.sequence + sequence) % MAX.UINT16;
        } else {
            this.sequence = sequence % MAX.UINT16;
        }

        this.buffer.writeUIntBE(this.sequence, 2, 2);
    }

    setTimestamp(timestamp, add)
    {
		if (timestamp === undefined) {
			timestamp = Date.now();
			add = false;
		}
        if (add) {
            this.timestamp = (this.timestamp + timestamp) % MAX.UINT32;
        } else {
            this.timestamp = timestamp % MAX.UINT32;
        }

        this.buffer.writeUIntBE(this.timestamp, 4, 4);
    }

    setSSRC(ssrc)
    {
        if (ssrc > MAX.UINT32) {throw new Error(`SSRC is over ${MAX.UINT32}`);}
        this.ssrc = ssrc;

        this.buffer.writeUIntBE(this.ssrc, 8, 4);
    }
}

module.exports = PacketRTPHeader;