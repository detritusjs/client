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
        if (encoding === 'json') {
            try {
                super.send(JSON.stringify(packet), {}, cb);
            } catch (e) {
                console.error(e.stack);
            }
        } else if (encoding === 'etf') {
            console.error('etf isnt supported yet');
        } else {
            console.error(`Invalid encoding: ${encoding}`);
        }
    }

    close(code, reason)
    {
        super.close(code, reason);

        //cleanup here
    }
}

module.exports = BaseSocket;