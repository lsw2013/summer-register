/**
 * date: 2019-5-6
 * author: lsw
 */

const WebSocket = require('ws');

const { handle } = require('./handle');

const log = console.log;
console.log = function (...args) {
    let date = new Date();
    let dateStr = date.toLocaleString();
    let milliseconds = date.getMilliseconds();
    let time = dateStr + '.' + milliseconds;
    args.unshift(time);
    log(...args);
}

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
        // server client container.
        this.serverClient = {};
        // server client List. eg: { 'server1': [ip1, ip2, ip3], 'server2': [ip4, ip5, ip6] }
        this.serverClientList = {};
        this.serverClientType = {};
    }

    /**
     * add server client to local attribute.
     * @param {string} name - server name
     * @param {string} host - server host
     */
    addServerClient(name, host) {
        if (!name) {
            console.warn(`server name: ${name} invalid!`);
            return;
        }
        if (!this.serverClientList[name]) {
            this.serverClientList[name] = [host];
        }
        else {
            if (!this.serverClientList[name].includes(host)) {
                this.serverClientList[name].push(host);
            }
        }
        this.serverClientType[host] = name;
        console.log(`add ${name} host: ${host}`);
        console.log(this.serverClientList);
    }

    /**
     * register client to local attribute and broadcast.
     * @param {string} host - client name.
     * @param {WebSocket} ws - client instance.
     */
    addClient(host, ws) {
        this.clients[host] = ws;
        this.clientList = Object.keys(this.clients);
        return this;
    }

    delClient(host) {
        delete this.clients[host];
        this.delServerClient(host);
        this.clientList = Object.keys(this.clients);
        this.broadcast();
        return this;
    }

    /**
     * 删掉 serverClientList 和 serverClient 中的对应数据
     * @param {string} host 
     */
    delServerClient(host) {
        delete this.serverClient[host];
        let name = this.serverClientType[host];
        let idx = this.serverClientList[name].indexOf(host);
        this.serverClientList[name].splice(idx, 1);
        return this;
    }

    broadcast(str) {

        str = str ? str : JSON.stringify(this.serverClientList);
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
        const _this = this;

        wss.on('connection', function connection(ws, req) {

            let {
                remoteAddress,
                remotePort
            } = req.connection;
            let host = remoteAddress + ':' + remotePort;
            console.log(`client 【${host}】 connected!`);

            ws.on('message', function incoming(message) {
                console.log('received: %s from: %s', message, host);
                _this.addClient(host, ws);
                handle(_this, host, ws, message);
                // TODO: handle msg for frontPage. I can handle this in addClient func. so does delClient.
            });

            ws.on('close', (code, reason) => {
                let {
                    remoteAddress,
                    remotePort
                } = ws._socket;
                let host = remoteAddress + ':' + remotePort;
                _this.delClient(host);
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