const UrlUtils = require('url');
const os = require('os');


const VoiceUDP = require('./VoiceUDP.js');
const Utils = require('../Utils');
const Constants = Utils.Constants;
const OpCodes = Constants.OpCodes;

const Dependencies = {
    BaseSocket: null
};

try {
    Dependencies.BaseSocket = require('./BaseSocket.js');
} catch(e) {}

const defaultOptions = {
	guildId: null,
	userId: null,
	sessionId: null,
	token: null
};

class Gateway
{
    constructor(client, options={})
    {
        if (!Dependencies.BaseSocket) {
            throw new Error('You must install `ws` to be able to use voice gateways!');
        }

        this.client = client;
        this.socket = null;

        options = Object.assign({}, defaultOptions, options);
        Object.defineProperties(this, {
			guildId: {writable: false, value: options.guildId},
			userId: {writable: false, value: options.userId},
			sessionId: {writable: false, value: options.sessionId},
			token: {writable: false, value: options.token}
        });
		
		this.gateway = null;
		this.identified = false;

        this._send = {
            expire: null,
            limit: 120,
            limitCounter: 0,
            limitTimestamp: 0,
            queue: [],
            ratelimit: 60 * 1000
        };

        this._heartbeat = {
            ack: false,
            lastAck: null,
			interval: null,
			nonce: null
		};

		this.udpinfo = {
			ssrc: null,
			port: null,
			modes: [],
			ip: null
		};

		this.udp = null;

		this.sdp = {
			audioCodec: null,
			mode: null,
			mediaSessionId: null,
			secret: null,
			videoCodec: null,
		};

		this.ssrcs = {
			audio: new Map(),
			video: new Map()
		};
    }

    get connected()
    {
        return this.socket && this.socket.connected;
    }

    get connecting()
    {
        return this.socket && this.socket.connecting;
    }

    _sendQueue()
    {
        this.socket.send(this._send.queue.shift());
        //add ratelimits
    }
    
    ping()
    {
        return new Promise((resolve, reject) => {
            if (!this.socket) {
                reject(new Error('Socket isn\'t set up.'));
            }
            const data = {
                nonce: Utils.Snowflake.generate()
            };

            const timeout = setTimeout(() => {
                reject(new Error(`Pong took longer than ${this.pingTimeout * 1000}ms.`));
            }, this.pingTimeout * 1000);

            const now = Utils.Tools.now();
            const cb = (d) => {
                try {
                    d = JSON.parse(d.toString());
                    if (d.nonce !== data.nonce) {
                        return;
                    }
                    clearTimeout(timeout);
                    this.socket.removeListener('pong', cb);
                    resolve(Math.round(Utils.Tools.now() - now));
                } catch(e) {
                }
            };
            this.socket.on('pong', cb);
            this.socket.ping(JSON.stringify(data));
        });
    }

    decode(data)
    {
        try {
            return JSON.parse(data);
        } catch (e) {
            console.error(e.stack);
        }
    }

    connect(endpoint)
    {
        if (this.connected) {
            this.disconnect();
		}

		this.gateway = (endpoint) ? `wss://${endpoint.split(':').shift()}` : this.gateway;

        const url = UrlUtils.parse(this.gateway);
        url.query = {v: Constants.ApiVersion.VOICE_GATEWAY};
		url.pathname = url.pathname || '/';
	
        const ws = this.socket = new Dependencies.BaseSocket(UrlUtils.format(url));
        ws.on('message', (data) => {
            if (ws !== this.socket) {return;}
            this.handle(data);
        });

        ws.on('close', (code, reason) => {
            if (ws !== this.socket) {return;}
            console.log(code, reason);
        });

        ws.on('error', (error) => {
            console.error(error);
        });
	}
	
	udpconnect(ip, port)
	{
		if (this.udp) {
			this.udp.disconnect();
		} else {
			this.udp = new VoiceUDP(this);
		}
		this.udp.connect(ip, port);
	}

    handle(data)
    {
		const packet = this.decode(data);
		
		console.log(packet);

        switch(packet.op)
        {
			case OpCodes.Voice.READY:
				this.udpinfo.ssrc = packet.d.ssrc;
				this.udpinfo.modes = packet.d.modes;
				this.udpinfo.ip = packet.d.ip;
				this.udpinfo.port = packet.d.port;
				this.ssrcs.audio.set(packet.d.ssrc, this.client.user.id);
				this.udpconnect(this.udpinfo.ip, this.udpinfo.port);
				break;
			case OpCodes.Voice.SESSION_DESCRIPTION:
				this.sdp.audioCodec = packet.d.audio_codec;
				this.sdp.mode = packet.d.mode;
				this.sdp.mediaSessionId = packet.d.media_session_id;
				this.sdp.videoCodec = packet.d.video_codec;
				this.sdp.secret = new Uint8Array(new ArrayBuffer(packet.d.secret_key.length));

				for (let i = 0; i < this.sdp.secret.length; i++) {
					this.sdp.secret[i] = packet.d.secret_key[i];
				}
				console.log(this.sdp);
				break;
			case OpCodes.Voice.SPEAKING:
				this.ssrcs.audio.set(packet.d.ssrc, packet.d.user_id);
				//emit it?
				//check to see if it already existed, if not, create decode/encoders
				break;
			case OpCodes.Voice.HEARTBEAT_ACK:
				if (packet.d !== this._heartbeat.nonce) {
					this.disconnect(OpCodes.Voice.HEARTBEAT_ACK, 'Invalid nonce received by Heartbeat ACK');
					this.connect();
					return;
				}
				this._heartbeat.lastAck = Utils.Tools.now();
				this._heartbeat.ack = true;
				break;
			case OpCodes.Voice.HELLO:
				this.setHeartbeat(packet.d);
				if (this.identified) {
					this.resume();
				} else {
					this.identify();
				}
				this.heartbeat();
				break;
			case OpCodes.Voice.RESUMED:
				console.log('resumed correctly lol');
				break;
			case OpCodes.Voice.CLIENT_CONNECT:
				this.ssrcs.audio.set(packet.d.audio_ssrc, packet.d.user_id);
				if (packet.d.video_ssrc) {
					this.ssrcs.video.set(packet.d.video_ssrc, packet.d.user_id);
				}
				//start the user id's decode/encoders too
				break;
			case OpCodes.Voice.CLIENT_DISCONNECT:
				Object.keys(this.ssrcs).forEach((ssrcType) => {
					const ssrcs = this.ssrcs[ssrcType];
					for (let key of ssrcs.keys()) {
						if (ssrcs.get(key) !== packet.d.user_id) {continue;}
						ssrcs.delete(key);
					}
				});
				//cleanup the user id's decode/encoders too
				break;
            default:
                console.error('unknown packet', packet);
        }
	}

	identify()
	{
        this.send(OpCodes.Voice.IDENTIFY, {
			'server_id': this.guildId,
			'user_id': this.userId,
			'session_id': this.sessionId,
			'token': this.token
		});
	}

	resume()
	{
		this.send(OpCodes.Voice.RESUME, {
			'server_id': this.guildId,
			'session_id': this.sessionId,
			'token': this.token
		});
	}
	
	heartbeat(fromInterval)
    {
        if (fromInterval) {
            if (!this._heartbeat.ack) {
                this.disconnect(OpCodes.Voice.HEARTBEAT_ACK, 'Heartbeat ACK never arrived.');
                this.connect();
                return;
            }
        }
		this._heartbeat.ack = false;
		this._heartbeat.nonce = Date.now();
        this.send(OpCodes.Voice.HEARTBEAT, this._heartbeat.nonce);
    }

    setHeartbeat(data)
    {
        if (data && data.heartbeat_interval > 0) {
            this._heartbeat.ack = true;
            if (this._heartbeat.interval) {
                clearInterval(this._heartbeat.interval);
            }
            this._heartbeat.interval = setInterval(() => {
                this.heartbeat(true);
			}, data.heartbeat_interval * 0.75);
        }
    }

    send(op, data, cb)
    {
        if (this.socket && this.socket.connected) {
            this._send.queue.push({op, data, cb, encoding: 'json'});
            this._sendQueue();
		}
	}

	disconnect(code, reason)
    {
		this.ssrcs.audio.clear();
		this.ssrcs.video.clear();

        if (this.connected) {
            if (code === OpCodes.Gateway.RECONNECT || code === OpCodes.Gateway.HEARTBEAT_ACK) {
                this.socket.close(4000, reason);
            } else {
                this.socket.close(code, reason);
            }

            //emit the disconnect
        }

        console.log(code, reason);

        this.socket.state = Constants.Detritus.State.CLOSED;
        this._send.queue = [];
    }
}

module.exports = Gateway;