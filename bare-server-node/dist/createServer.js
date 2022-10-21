import BareServer from './Server.js';
import registerV1 from './V1.js';
import registerV2 from './V2.js';
export default function createBareServer(directory, init = {}) {
    const server = new BareServer(directory, init);
    registerV1(server);
    registerV2(server);
    return server;
}
