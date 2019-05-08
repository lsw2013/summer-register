/**
 * handle msg
 */

exports = module.exports = {
    handle
}

/**
 * handle msg from client
 * @param {Server} register - server instance
 * @param {string} host - client host
 * @param {WebSocket} ws - client instance
 * @param {string} msg - received msg
 */
function handle(register, host, ws, msg) {
    try {
        msg = JSON.parse(msg);
    }
    catch (e) {
        if (e) {
            console.error(`client msg error: ${e}`);
            return;
        }
    }
    console.log(`client msg: ${JSON.stringify(msg)}`);

    let { type, name, data } = msg;
    register.setClientType(type, host, name);
    switch (type) {
        // handler server client
        case 'server':
            register.serverClient[host] = ws;
            register.addServerClient(name, host);
            register.broadcast(); // only broadcast when new server join
            break;
        case 'heartbeat':
            console.log(`heartbeat data: ${data}`);
            break;
        default:
            console.warn('unexpected client type: ', type, host);
            break;
    }
}