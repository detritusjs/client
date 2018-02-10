class Handler
{
    constructor(gateway)
    {
        this.gateway = gateway;
        this.client = this.gateway.client;
    }

    event(packet)
    {
        const handle = this[`_${packet.t.toLowerCase()}`];
        if (handle) {
            handle.call(this, packet.d);
        } else {
            console.log(packet);
        }
    }

    _ready(data)
    {
        this.gateway.sessionId = data.session_id;
        console.log('ready', data);
    }

    _resume(data)
    {
        this.gateway.sessionId = data.session_id;
        console.log('resume', data);
    }
}

module.exports = Handler;