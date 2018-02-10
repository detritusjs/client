'use strict';

const LINE_BREAK = '\r\n';

class MultipartData
{
    constructor()
    {
        this.boundary = this.generateBoundary();
        this.buffers = [];
    }

    add(field, value, options={})
    {
        if (typeof(options) === 'string') {
            options = {filename: options};
        }
        if (typeof(value) === 'number') {
            value = `${value}`;
        }
        const data = [];
        data.push(`--${this.boundary}`);
        data.push(`Content-Disposition: form-data; name="${field}"` + ((options.filename) ? `; filename="${options.filename}"` : ''));
        if (value instanceof Buffer) {
            data.push('Content-Type: application/octet-stream');
        } else if (typeof(value) === 'object') {
            data.push('Content-Type: application/json');
            value = new Buffer(JSON.stringify(value));
        } else {
            value = new Buffer(`${value}`);
        }
        this.buffers.push(new Buffer(LINE_BREAK + data.join(LINE_BREAK) + LINE_BREAK.repeat(2)));
        this.buffers.push(value);
    }

    done()
    {
        this.buffers.push(new Buffer(`${LINE_BREAK}--${this.boundary}--`));
        return this.buffers;
    }

    generateBoundary()
    {
        var boundary = '-'.repeat(26);
        for (var i = 0; i < 24; i++) {
            boundary += Math.floor(Math.random() * 10).toString(16);
        }
        return boundary;
    }
}

module.exports = MultipartData;