/**
 * date: 2019-5-6
 * author: lsw
 */

const WebSocket = require('ws');

/**
 * register server
 */
exports = module.exports = class Server {
    /**
     * create server instance.
     * @param {Object} config - server configs
     * @param {number} config.port - socket port
     * @param {number} config.heartbeatInterval - heart beat interval.
     */
    constructor(config = {}) {
        // default socket port 8899.
        this.port = parseInt(config.port) || 8899;
        // heartbeat every 20s.
        this.heartbeatInterval = parseInt(config.heartbeat) || 2000 * 10;
        // client container.
        this.clients = {};
        // client name list.
        this.clientList = [];
    }

    /**
     * register client to local attribute and broadcast.
     * @param {string} host - client name.
     * @param {WebSocket} ws - client instance.
     */
    addClient(host, ws) {
        this.clients[host] = ws;
        this.clientList = Object.keys(this.clients);
        this.broadcast();
        return this;
    }

    delClient(host) {
        delete this.clients[host];
        this.clientList = Object.keys(this.clients);
        return this;
    }

    broadcast(str) {

        str = str ? str : JSON.stringify(this.clientList);
        let entries = Object.entries(this.clients);
        if (!entries.length) {
            console.log(`not have client connected!`);
            return;
        }
        entries.forEach(arr => {
            let [host, ws] = arr;
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(str);
            }
            else {
                this.delClient(host);
            }
        });
    }

    heartbeat() {
        console.log('start heartbeat!');
        setInterval(() => {
            this.broadcast('pong');
        }, this.heartbeatInterval);
    }

    start() {
        this.wss = new WebSocket.Server({
            port: this.port
        });
        console.log(`server started! listening ${this.port} ...`);

        const wss = this.wss;
        const that = this;

        wss.on('connection', function connection(ws, req) {

            let {
                remoteAddress,
                remotePort
            } = req.connection;
            let host = remoteAddress + ':' + remotePort;
            console.log(`client 【${host}】 connected!`);

            ws.on('message', function incoming(message) {
                console.log('received: %s from: %s', message, host);
                that.addClient(host, ws);
                // TODO: handle msg for frontPage. I can handle this in addClient func. so does delClient.
            });

            ws.on('close', (code, reason) => {
                let {
                    remoteAddress,
                    remotePort
                } = ws._socket;
                let host = remoteAddress + ':' + remotePort;
                that.delClient(host);
                console.log(`client 【${host}】 closed, code: ${code}, reason: ${reason}`);
            });
        });

        wss.on('error', err => {
            console.error(`server start error: ${err}`);
            process.exit(1);
        });
        this.heartbeat();
        return this;
    }
}