const Constants = require('./Constants.js');
const cache = {
    lastTimestamp: 0,
    sequence: 0
};

class Snowflake
{
    constructor()
    {
        throw new Error('sorry bud, cant construct this');
    }

    static generate(workerId=0, processId=0)
    {
        let timestamp = Date.now() - Constants.Epoch.SNOWFLAKE,
            seq = cache.sequence = (timestamp === cache.lastTimestamp) ? ++cache.sequence : 0;

        cache.lastTimestamp = timestamp;

        timestamp = timestamp.toString(2).padStart(42, '0');
        workerId = workerId.toString(2).padStart(5, '0');
        processId = processId.toString(2).padStart(5, '0');
        seq = seq.toString(2).padStart(12, '0');

        let binary = `${timestamp}${workerId}${processId}${seq}`,
            id = '';
        
        //thanks discord.js
        while (binary.length > 50) {
            const high = parseInt(binary.slice(0, -32), 2);
            const low = parseInt((high % 10).toString(2) + binary.slice(-32), 2);

            id = (low % 10).toString() + id;
            binary = Math.floor(high / 10).toString(2) + Math.floor(low / 10).toString(2).padStart(32, '0');
        }

        binary = parseInt(binary, 2);
        while (binary > 0) {
            id = (binary % 10).toString() + id;
            binary = Math.floor(binary / 10);
        }
        
        return id;
    }

    static timestamp(snowflake)
    {
        return snowflake ? parseInt((+snowflake / 4194304) + Constants.Epoch.SNOWFLAKE) : 0;
    }
}

module.exports = Snowflake;