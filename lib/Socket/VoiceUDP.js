const dgram = require('dgram');

const Utils = require('../Utils');
const Constants = Utils.Constants;
const OpCodes = Constants.OpCodes;

const Packet = Constants.Voice.PACKET;
const RTCP = Packet.RTCP;

const Voice = require('../Voice');


class VoiceUDP
{
	constructor(voiceGateway)
	{
		this.voiceGateway = voiceGateway;

		this.remote = {
			ip: null,
			port: null
		};

		this.local = {
			ip: null,
			port: null
		};

		this.ssrc = null;
		this.mode = null;

		this.socket = null;

		this.crypto = new Voice.PacketCrypto(); //allow pass in for module use
		this.header = new Voice.PacketRTPHeader(Packet.HEADER.TYPE, Packet.HEADER.VERSION);

		this.connection = false;


		this.listening = false;


		this.rtcp = {
			senderReport: new Buffer(40),
			nonce: new Buffer(24),
			encrypted: new Buffer(40 + 16)
		};

		//thank you q (discordie)
		this.rtcp.senderReport.fill(0);
		this.rtcp.senderReport[0] = RTCP.RTP.VERSION_TWO;
		this.rtcp.senderReport[1] = RTCP.TYPE.SENDER_REPORT;

		this.rtcp.senderReport.writeUInt16BE(6, 2); //length 6, sender report details
		//this.rtcp.senderReport.writeUInt32BE(ssrc, 4);
		this.rtcp.senderReport.writeUInt32BE(0, RTCP.OFFSET.MSW_TIMESTAMP);
		this.rtcp.senderReport.writeUInt32BE(0, RTCP.OFFSET.LSW_TIMESTAMP);
		this.rtcp.senderReport.writeUInt32BE(0, RTCP.OFFSET.RTP_TIMESTAMP);
		this.rtcp.senderReport.writeUInt32BE(0, RTCP.OFFSET.PACKETS_SENT);
		this.rtcp.senderReport.writeUInt32BE(0, RTCP.OFFSET.BYTES_SENT);

		//rtcp source description
		this.rtcp.senderReport[28] = RTCP.RTP.VERSION_TWO_SOURCE_ONE;
		this.rtcp.senderReport[29] = RTCP.TYPE.SOURCE_DESCRIPTION;
		this.rtcp.senderReport.writeUInt16BE(2, 30); //length 2, source description
		
		//this.rtcp.senderReport.writeUInt32BE(ssrc, 32);
		this.rtcp.senderReport[36] = 1; //type CNAME
		this.rtcp.senderReport[37] = 0; //length 0
		this.rtcp.senderReport[38] = 0; //type END
		this.rtcp.senderReport[39] = 0; //length 0

		this.rtcp.nonce.fill(0);
		this.rtcp.senderReport.copy(this.rtcp.nonce, 0, 0, 8);

		this.rtcp.encrypted.fill(0);
		this.rtcp.senderReport.copy(this.rtcp.encrypted, 0, 0, 8);
	}

	get connected()
	{
		return this.connection;
	}

	setSSRC(ssrc)
	{
		this.ssrc = ssrc;
		this.header.setSSRC(ssrc);
	}

	setMode(mode)
	{
		if (!Constants.Voice.MODES.includes(mode)) {throw new Error(`Encryption mode '${mode}' is not supported.`);}
		this.mode = mode;
	}

	connect(ip, port)
	{
		this.remote.ip = ip || this.remote.ip;
		this.remote.port = port || this.remote.port;

		if (this.connected) {this.disconnect();}

		this.socket = dgram.createSocket('udp4');

		this.socket.on('message', this.onPacket.bind(this));
		this.socket.on('error', this.onError.bind(this));
		this.socket.on('close', this.onClose.bind(this));

		this.connection = true;

		const ipDiscovery = Buffer.alloc(70);
		ipDiscovery.writeUIntBE(this.ssrc, 0, 4);
		this.send(ipDiscovery);
	}

	disconnect()
	{
		if (this.socket) {
			this.socket.close();
			this.socket = null;
		}

		//reset the packets

		this.connection = false;
	}

	onPacket(packet, rinfo)
	{
		if (packet.length === 70) {
			if (this.ssrc !== packet.readUInt32LE(0)) {
				throw new Error('SSRC mismatch in ip discovery packet');
			}

			this.local.ip = packet.slice(4, packet.indexOf(0, 4)).toString();
			this.local.port = packet.readUIntLE(packet.length - 2, 2);

			console.log('ip identify', this.ssrc, this.mode, this.local, this.remote);

			this.voiceGateway.send(OpCodes.Voice.SELECT_PROTOCOL, {
				'protocol': 'udp',
				'data': {
					'address': this.local.ip,
					'port': this.local.port,
					'mode': 'xsalsa20_poly1305' || this.mode
				}
			});
		} else {
			console.log('onpacket', packet, rinfo);
			//check if any decoders exist, if not return
			const packet = new Voice.PacketRTP(packet, this.mode);

			const data = this.crypto.decrypt(packet.data, packet.nonce);
			if (!packet) {return console.error('packet failed to decrypt lol');}
			
			console.log(packet, data);
			//deal with the one byte rtp header stuff
			/*
			if (Packet.RTP.HEADERS.ONE_BYTE.every((header, i) => header === packet[i])) {
				let rtpHeaderLen = packet[2] << 8 | packet[3];
	
				let offset = 4;
				for (let i = 0; i < rtpHeaderLen; i++) {
					const byte = packet[offset];
					offset += (byte & Packet.RTP.LOCAL_IDENTIFER) + 2;
					while (packet[offset] === 0) {
						offset++; //basically skip the end padding if we reached the end
					}
				}
	
				packet = packet.slice(offset);
			}
			console.log(nonce, message, packet);
			//decode the packet.data now
			*/
		}
	}

	onError(error, message)
	{
		console.log('socket error', error, message);
	}

	onClose()
	{
		console.log('socket closed', this.ip, this.port);

		this.connection = false;
	}

	send(packet)
	{
		if (!this.connected || !this.socket) {throw new Error('UDP not connected yet!');}
		this.socket.send(packet, 0, packet.length, this.remote.port, this.remote.ip, (error, bytes) => {
			console.log('sent packet', error, bytes);
		});
	}

	sendEncode(packet, sequence, timestamp)
	{
		this.header.setSequence(sequence);
		this.header.setTimestamp(timestamp); //maybe use framesize

		let raw;
		switch (this.mode) {
			case 'xsalsa20_poly1305_lite': {
				this.header.setNonce();
				raw = [this.crypto.encrypt(packet, this.header.nonce.buffer), this.header.nonce.buffer];
			}; break;
			case 'xsalsa20_poly1305_suffix': {
				const nonce = this.crypto.generateNonce();
				raw = [this.crypto.encrypt(packet, nonce), nonce];
			}; break;
			case 'xsalsa20_poly1305': {
				raw = this.crypto.encrypt(packet, this.header.buffer);
			}; break;
			default: {
				throw new Error(`${this.mode} is not supported for encoding.`);
			};
		}

		if (Array.isArray(raw)) {
			raw = Buffer.concat([this.header.buffer].concat(raw));
		} else {
			raw = Buffer.concat([this.header.buffer, raw]);
		}
		this.send(raw);

		//maybe implement rtcp like discordie has
	}

	sendRTCP()
	{
		if (this.rtcp.sendTimer) {
			clearTimeout(this.rtcp.sendTimer);
			this.rtcp.sendTimer = null;
		}
		//check ready
		this.send(this.updateRTCP());

		this.rtcp.sendTimer = setTimeout(() => {
			this.sendRTCP();
		}, Math.max(Math.random() * 10, 1) * 1000);
	}

	updateRTCP()
	{
		const rtcp = this.rtcp.senderReport;

		const time = Date.now() + RTCP.UNIXTIME_OFFSET_70_YEARS_OR_SO;
		const msw = time / 1000;
		const lsw = (msw - Math.floor(msw)) * 0xFFFFFFFF;

		rtcp.writeUInt32BE(this.udpinfo.ssrc, 4);

		rtcp.writeUInt32BE(msw, RTCP.OFFSET.MSW_TIMESTAMP);
		rtcp.writeUInt32BE(lsw, RTCP.OFFSET.LSW_TIMESTAMP);
		rtcp.writeUInt32BE(this.packet.timestamp, RTCP.OFFSET.RTP_TIMESTAMP);
		rtcp.writeUInt32BE(this.packet.sent, RTCP.OFFSET.PACKETS_SENT);
		rtcp.writeUInt32BE(this.packet.bytesMuxed, RTCP.OFFSET.BYTES_SENT);

		rtcp.writeUInt32BE(this.udpinfo.ssrc, 32);

		if (this.sdp.mode !== 'xsalsa20_poly1305') {
			return rtcp;
		}

		const encrypted = VoicePacker.pack(rtcp.slice(8), this.rtcp.nonce, this.sdp.secret);
		encrypted.copy(this.rtcp.encrypted, 8);

		return this.rtcp.encrypted;
	}
}

module.exports = VoiceUDP;