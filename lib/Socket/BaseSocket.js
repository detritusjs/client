'use strict';

const WebSocket = require('ws');

const Constants = require('../Utils').Constants;

class BaseSocket extends WebSocket
{
    constructor(url)
    {
        super(url, {

        });

        this.state = Constants.Detritus.State.CONNECTING;

        this.on('open', () => {
            this.state = Constants.Detritus.State.CONNECTED;
        });

        this.on('close', (code, reason) => {
            this.state = Constants.Detritus.State.CLOSED;
        });
    }

    get connected()
    {
        return this.state === Constants.Detritus.State.CONNECTED;
    }

    get connecting()
    {
        return this.state === Constants.Detritus.State.CONNECTING;
    }

    send({op, data, cb, encoding})
    {
        const packet = {
            op: op,
            d: data
		};

		let encoded;
		switch (encoding) {
			case 'json': {
				try {
					encoded = JSON.stringify(packet);
				} catch (e) {console.error(e.stack);}
			}; break;
			case 'etf': {
				console.error('etf isnt supported yet');
				return;
			}; break;
			default: {
				console.error(`Invalid encoding: ${encoding}`);
				return;
			};
		}
		
		return super.send(encoded, {}, cb);
    }

    close(code, reason)
    {
        super.close(code, reason);

        //cleanup here
    }
}

module.exports = BaseSocket;