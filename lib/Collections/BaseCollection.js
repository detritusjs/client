class BaseCollection extends Map
{
    constructor()
    {
        super();
    }

    get length()
    {
        return this.size;
    }

    find(key, value)
    {
        if (key === 'id') {
            return super.get(value);
        }
        const isFunction = (typeof(key) === 'function');

        for (var val of super.values())
        {
            if (isFunction && key(val)) {
                return val;
            } else if (val.hasOwnProperty(key) && val[key] == value) {
                return val;
            }
        }
    }

    filter(key, value)
    {
        const arr = [];
        const isFunction = (typeof(key) === 'function');

        for (var val of super.values())
        {
            if (isFunction && key(val)) {
                arr.push(val);
            } else if (val.hasOwnProperty(key) && val[key] == value) {
                arr.push(val);
            }
        }
        return arr;
    }

    map(func)
    {
        const arr = [];
        for (var val of super.values())
        {
            if (func(val)) {
                arr.push(val);
            }
        }
        return arr;
    }
}

module.exports = BaseCollection;