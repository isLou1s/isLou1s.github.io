import { Request, Response, writeResponse } from './AbstractMessage.js';
import createHttpError from 'http-errors';
import { EventEmitter } from 'node:events';
import { readFile } from 'node:fs/promises';
export class BareError extends Error {
    status;
    body;
    constructor(status, body) {
        super(body.message || body.code);
        this.status = status;
        this.body = body;
    }
}
const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf-8'));
const project = {
    name: 'bare-server-node',
    description: 'TOMPHTTP NodeJS Bare Server',
    repository: 'https://github.com/tomphttp/bare-server-node',
    version: pkg.version,
};
export function json(status, json) {
    const send = Buffer.from(JSON.stringify(json, null, '\t'));
    return new Response(send, {
        status,
        headers: {
            'content-type': 'application/json',
            'content-length': send.byteLength.toString(),
        },
    });
}
export default class Server extends EventEmitter {
    routes;
    socketRoutes;
    directory;
    config;
    constructor(directory, init = {}) {
        super();
        init.logErrors ??= false;
        this.config = init;
        this.routes = new Map();
        this.socketRoutes = new Map();
        if (typeof directory !== 'string') {
            throw new Error('Directory must be specified.');
        }
        if (!directory.startsWith('/') || !directory.endsWith('/')) {
            throw new RangeError('Directory must start and end with /');
        }
        this.directory = directory;
    }
    /**
     * Remove all timers and listeners
     */
    close() {
        this.emit('close');
    }
    shouldRoute(request) {
        return request.url !== undefined && request.url.startsWith(this.directory);
    }
    get instanceInfo() {
        return {
            versions: ['v1', 'v2'],
            language: 'NodeJS',
            memoryUsage: Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100,
            maintainer: this.config.maintainer,
            project,
        };
    }
    async routeUpgrade(req, socket, head) {
        const request = new Request(req, {
            method: req.method,
            path: req.url,
            headers: req.headers,
        });
        const service = request.url.pathname.slice(this.directory.length - 1);
        if (this.socketRoutes.has(service)) {
            const call = this.socketRoutes.get(service);
            try {
                await call(this.config, request, socket, head);
            }
            catch (error) {
                if (this.config.logErrors) {
                    console.error(error);
                }
                socket.end();
            }
        }
        else {
            socket.end();
        }
    }
    async routeRequest(req, res) {
        const request = new Request(req, {
            method: req.method,
            path: req.url,
            headers: req.headers,
        });
        const service = request.url.pathname.slice(this.directory.length - 1);
        let response;
        try {
            if (request.method === 'OPTIONS') {
                response = new Response(undefined, { status: 200 });
            }
            else if (service === '/') {
                response = json(200, this.instanceInfo);
            }
            else if (this.routes.has(service)) {
                const call = this.routes.get(service);
                response = await call(this.config, request);
            }
            else {
                throw new createHttpError.NotFound();
            }
        }
        catch (error) {
            if (this.config.logErrors) {
                console.error(error);
            }
            if (error instanceof Error) {
                response = json(500, {
                    code: 'UNKNOWN',
                    id: `error.${error.name}`,
                    message: error.message,
                    stack: error.stack,
                });
            }
            else {
                response = json(500, {
                    code: 'UNKNOWN',
                    id: 'error.Exception',
                    message: error,
                    stack: new Error(error).stack,
                });
            }
            if (!(response instanceof Response)) {
                if (this.config.logErrors) {
                    console.error('Cannot', request.method, request.url.pathname, ': Route did not return a response.');
                }
                throw new createHttpError.InternalServerError();
            }
        }
        response.headers.set('x-robots-tag', 'noindex');
        response.headers.set('access-control-allow-headers', '*');
        response.headers.set('access-control-allow-origin', '*');
        response.headers.set('access-control-allow-methods', '*');
        response.headers.set('access-control-expose-headers', '*');
        // don't fetch preflight on every request...
        // instead, fetch preflight every 10 minutes
        response.headers.set('access-control-max-age', '7200');
        writeResponse(response, res);
    }
}
