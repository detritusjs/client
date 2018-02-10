const UrlUtils = require('url');

const Constants = require('../Utils').Constants;

const defaultOptions = {
    shardId: 0,
    shardCount: 1,
    encoding: 'json',
    compressed: false
};

class ShardManager
{
    constructor(client, options={})
    {
        this.client = client;

        options = Object.assign({}, defaultOptions, options);
        Object.defineProperties(this, {
            compress: {writable: false, value: options.compress},
            encoding: {writable: false, value: options.encoding},
            shardCount: {writable: true, value: options.shardCount}
        });

        if (!Constants.Gateway.Encoding.includes(this.encoding)) {
            throw new Error(`Invalid Encoding Type, valid: ${JSON.stringify(Constants.Gateway.Encoding)}`);
        }
    }

    getGateway(isAuto)
    {
        if (isAuto) {
            this.client.isBot = true;
        }
        const uri = (isAuto) ? Constants.RestEndpoints.GATEWAY_BOT : Constants.RestEndpoints.GATEWAY;
        return this.client.rest.request({
            method: 'get',
            uri: uri,
            useAuth: isAuto
        });
    }

    run()
    {
        const isAuto = (this.shardCount === 'auto');
        return this.getGateway(isAuto).then((data) => {
            if (!data.url || (isAuto && !data.shards)) {
                return Promise.reject(new Error('Discord API messed up.'));
            }

            const url = UrlUtils.parse(data.url); 
            url.query = {encoding: this.encoding, v: Constants.ApiVersion.GATEWAY};
            url.pathname = url.pathname || '/';

            if (this.compress) {
                Object.assign(url.query, {compress: 'zlib-stream'});
            }
    
            console.log(UrlUtils.format(url));
        }).catch((error) => {
            console.log(error);
        });
    }
}

module.exports = ShardManager;