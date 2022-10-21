import createBareServer from './createServer.js';
import { Command } from 'commander';
import { config } from 'dotenv';
import http from 'node:http';
config();
const program = new Command();
program
    .alias('server')
    .option('-d, --directory <directory>', 'Bare directory', '/')
    .option('-h, --host <host>', 'Listening host', process.env.HOST)
    .option('-p, --port <port>', 'Listening port', process.env.PORT || '80')
    .option('-e, --errors', 'Error logging', 'ERRORS' in process.env)
    .option('-la, --local-address <address>', 'Address/network interface', process.env.LOCAL_ADDRESS)
    .option('-m, --maintainer <{email?:string,website?:string}>', 'Bare Server maintainer field')
    .action(({ directory, errors, host, port, localAddress, maintainer, }) => {
    const bareServer = createBareServer(directory, {
        logErrors: errors,
        localAddress,
        maintainer: typeof maintainer === 'string' ? JSON.parse(maintainer) : undefined,
    });
    console.info('Created Bare Server on directory:', directory);
    console.info('Error logging is', errors ? 'enabled.' : 'disabled.');
    const httpServer = http.createServer();
    console.info('Created HTTP server.');
    httpServer.on('request', (req, res) => {
        if (bareServer.shouldRoute(req)) {
            bareServer.routeRequest(req, res);
        }
        else {
            res.writeHead(400);
            res.end('Not found.');
        }
    });
    httpServer.on('upgrade', (req, socket, head) => {
        if (bareServer.shouldRoute(req)) {
            bareServer.routeUpgrade(req, socket, head);
        }
        else {
            socket.end();
        }
    });
    httpServer.on('listening', () => {
        const address = httpServer.address();
        console.log(`HTTP server listening. View live at http://${address.family === 'IPv6' ? `[${address.address}]` : address.address}:${address.port}${directory}`);
    });
    httpServer.listen({
        host: host,
        port: port,
    });
});
program.parse(process.argv);
