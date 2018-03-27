const dgram = require('dgram');

const Utils = require('../Utils');
const Constants = Utils.Constants;
const OpCodes = Constants.OpCodes;


class VoiceUDP
{
	constructor(voiceGateway)
	{
		this.voiceGateway = voiceGateway;
		this.client = this.voiceGateway.client;

		this.socket = null;
	}

	send(packet)
	{
		try {
			this.socket.send(packet, 0, packet.length, this.port, this.ip);
		} catch(e) {
			console.log(e);
		}
	}

	connect(ip, port)
	{
		this.ip = ip;
		this.port = port;

		this.socket = dgram.createSocket('udp4');

		this.socket.once('message', (packet) => {
			const ip = {
				address: '',
				port: null,
				finished: false
			};
			for (let i = 4; !ip.finished; i++) {
				if (packet[i] === 0) {
					ip.finished = true;
				} else {
					ip.address += String.fromCharCode(packet[i]);
				}
			}
			ip.port = parseInt(packet.readUIntLE(packet.length - 2, 2).toString(10));

			this.voiceGateway.send(OpCodes.Voice.SELECT_PROTOCOL, {
				protocol: 'udp',
				data: {
					address: ip.address,
					port: ip.port,
					mode: 'xsalsa20_poly1305'
				}
			});
			console.log(ip, this.voiceGateway.udpinfo);
		});

		this.socket.on('error', (error, message) => {
			console.log(error, message);
		});

		this.socket.on('close', (error) => {
			console.log(error);
		});

		const firstPacket = new Buffer(70);
		firstPacket.fill(0);
		firstPacket.writeUIntBE(this.voiceGateway.udpinfo.ssrc, 0, 4);
		this.send(firstPacket);
	}

	disconnect()
	{

	}
}

module.exports = VoiceUDP;