const UrlUtils = require('url');
const os = require('os');

const BaseSocket = require('./BaseSocket.js');
const Handler = require('../Handler');
const Utils = require('../Utils');
const Constants = Utils.Constants;

const defaultOptions = {
    autoReconnect: true,
    compressed: false,
    disabledEvents: [],
    encoding: 'json',
    largeThreshold: 250,
    shardCount: 1,
    shardId: 0
};

class Gateway
{
    constructor(client, options={})
    {
        this.client = client;
        this.socket = null;

        options = Object.assign({}, defaultOptions, options);
        Object.defineProperties(this, {
            compressed: {writable: false, value: options.compress},
            encoding: {writable: false, value: options.encoding},
            disabledEvents: {writable: false, value: options.disabledEvents},
            largeThreshold: {writable: false, value: options.largeThreshold},
            shardCount: {writable: false, value: options.shardCount},
            shardId: {writable: false, value: options.shardId}
        });

        if (!Constants.Gateway.Encoding.includes(this.encoding)) {
            throw new Error(`Invalid Encoding Type, valid: ${JSON.stringify(Constants.Gateway.Encoding)}`);
        }

        this.handler = new Handler(this);

        this.seq = 0;
        this.sendQueue = [];
        this.sessionId = null;
        this.discordTrace = [];

        this._heartbeat = {
            ack: false,
            lastAck: null,
            interval: null
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
                reject(new Error('Pong took longer than 1000ms.'));
            }, 1000);

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
            if (data instanceof ArrayBuffer) {
                if (this.compress || this.encoding === 'etf') {
                    data = new Buffer(data);
                }
            } else if (Array.isArray(data)) {
                data = Buffer.concat(data);
            }

            if (this.compress) {
                return data;
            } else if (this.encoding === 'etf') {
                return data;
            } else {
                return JSON.parse(data);
            }
        } catch (e) {
            console.error(e.stack);
        }
    }

    connect(url)
    {
        if (this.connected) {
            this.disconnect();
        }

        this.gateway = url || this.gateway;

        url = UrlUtils.parse(this.gateway);
        url.query = {encoding: this.encoding, v: Constants.ApiVersion.GATEWAY};
        url.pathname = url.pathname || '/';

        if (this.compress) {
            Object.assign(url.query, {compress: 'zlib-stream'});
        }

        console.log(UrlUtils.format(url));
        const ws = this.socket = new BaseSocket(UrlUtils.format(url));
        ws.on('message', (data) => {
            if (ws != this.socket) {return;}
            this.handle(data);
        });

        ws.on('close', (code, reason) => {
            if (ws != this.socket) {return;}
            console.log(code, reason);
        });
    }

    handle(data)
    {
        const packet = this.decode(data);
        if (packet.s) {
            if (packet.s > this.seq + 1 && this.socket && !this.socket.resuming) {
                console.error('bad seq');
                this.seq = packet.s;
                this.resume();
            }
            this.seq = packet.s;
        }

        switch(packet.op)
        {
            case Constants.OpCodes.Gateway.DISPATCH:
                this.handler.event(packet);
                break;
            case Constants.OpCodes.Gateway.HEARTBEAT:
                this.heartbeat();
                break;
            case Constants.OpCodes.Gateway.RECONNECT:
                break;
            case Constants.OpCodes.Gateway.INVALID_SESSION:
                this.seq = 0;
                this.sessionId = null;
                console.error('Invalid session');
                this.identify();
                break;
            case Constants.OpCodes.Gateway.HELLO:
                this.setHeartbeat(packet.d);
                if (this.sessionId) {
                    this.resume();
                } else {
                    this.identify();
                }
                this.heartbeat();
                break;
            case Constants.OpCodes.Gateway.HEARTBEAT_ACK:
                this._heartbeat.lastAck = Utils.Tools.now();
                this._heartbeat.ack = true;
                break;
            default:
                console.error('unknown packet', packet);
        }
    }

    identify()
    {
        const data = {
            token: this.client.options.token,
            properties: {
                '$os': `${os.type()} ${os.release()}; ${os.arch()}`,
                '$browser': process.version.replace(/^v/, (process.release.name || 'node') + '/'),
                '$device': `Detritus v${Constants.VERSION}`
            },
            v: Constants.ApiVersion.GATEWAY,
            compress: this.compress,
            large_threshold: this.largeThreshold,
            shard: [this.shardId, this.shardCount]
        };

        //maybe even have presence here

        this.send(Constants.OpCodes.Gateway.IDENTIFY, data);
    }

    resume()
    {
        this.send(Constants.OpCodes.Gateway.RESUME, {
            token: this.client.options.token,
            session_id: this.sessionId,
            seq: this.seq
        });
    }

    heartbeat(interval)
    {
        if (interval) {

        }
        this.send(Constants.OpCodes.Gateway.HEARTBEAT, this.seq);
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
            }, data.heartbeat_interval);
        }
        this.discordTrace = data._trace;
    }

    send(op, code, cb)
    {
        if (this.socket && this.socket.connected) {
            this.socket.send(op, code, cb, this.encoding);
        }
    }
}

module.exports = Gateway;