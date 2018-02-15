class BaseStructure
{
    constructor(client, raw)
    {

        Object.defineProperties(this, {
            _client: {enumberable: false, writable: true, value: client},
            raw: {enumberable: false, writable: false, value: raw}
        });
        for (var key in this.raw) {
            const descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(this), key);
            if (descriptor && descriptor.get) {
                continue;
            }
            try {
                Object.defineProperty(this, key, {
                    value: this.raw[key],
                    writable: false
                });
            } catch (e) {
                console.log(e);
            }
        }
    }

    merge(raw)
    {
        if (!raw) {
            return this;
        }
        const _new = Object.assign({}, this.raw);
        for (let key in raw) {
            if (Array.isArray(raw[key])) {
                _new[key] = (Array.isArray(this.raw[key]) ? this.raw[key] : []).concat(raw[key]);
            } else if (typeof(raw[key]) === 'object') {
                _new[key] = Object.assign({}, _new[key], raw[key]);
            } else {
                _new[key] = raw[key];
            }
        }
        return new this.constructor(this._client, _new);
    }
}

module.exports = BaseStructure;