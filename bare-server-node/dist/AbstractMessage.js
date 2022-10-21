import { Headers } from 'headers-polyfill';
import Stream from 'node:stream';
/**
 * Abstraction for the data read from IncomingMessage
 */
export class Request {
    body;
    method;
    headers;
    url;
    constructor(body, init) {
        this.body = body;
        this.method = init.method;
        this.headers = new Headers(init.headers);
        this.url = new URL(`http:${this.headers.get('host')}${init.path}`);
    }
    get query() {
        return this.url.searchParams;
    }
}
export class Response {
    body;
    status;
    statusText;
    headers;
    constructor(body, init = {}) {
        if (body) {
            this.body = body instanceof Stream ? body : Buffer.from(body);
        }
        if (typeof init.status === 'number') {
            this.status = init.status;
        }
        else {
            this.status = 200;
        }
        if (typeof init.statusText === 'string') {
            this.statusText = init.statusText;
        }
        this.headers = new Headers(init.headers);
    }
}
export function writeResponse(response, res) {
    for (const [header, value] of response.headers) {
        res.setHeader(header, value);
    }
    res.writeHead(response.status, response.statusText);
    if (response.body instanceof Stream) {
        response.body.pipe(res);
    }
    else if (response.body instanceof Buffer) {
        res.end(response.body);
    }
    else {
        res.end();
    }
    return true;
}
