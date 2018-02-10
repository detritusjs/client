class BaseStructure
{
    constructor(client, raw)
    {
        this._client = client;
        for (var key in raw) {
            try {
                if (!this.hasOwnProperty(key)) {
                    this[key] = raw[key];
                }
                continue;
            } catch(e) {}
            this[`_${key}`] = raw[key];
        }
    }

    merge(raw)
    {
        if (!raw) {
            return this;
        }

        const _new = {};
        for (var key in this) {
            if (typeof(this[key]) === 'function') {
                continue;
            }
            _new[key] = this[key];
        }
        for (var key in raw) {
            _new[key] = raw[key];
        }
        return new this.constructor(this._client, _new);
    }
}

module.exports = BaseStructure;