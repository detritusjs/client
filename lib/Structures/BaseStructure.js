class BaseStructure
{
    constructor(client, raw)
    {

        Object.defineProperties(this, {
            _client: {enumberable: false, writable: true, value: client},
            raw: {enumberable: false, writable: false, value: raw}
        });
        for (var key in this.raw) {
            try {
                Object.defineProperty(this, key, {
                    value: raw[key],
                    writable: false
                });
            } catch(e) {}
        }
    }

    merge(raw)
    {
        if (!raw) {
            return this;
        }

        return new this.constructor(this._client, Object.assign({}, this.raw, raw));
    }
}

module.exports = BaseStructure;