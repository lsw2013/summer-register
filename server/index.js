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
 * 广播时只需要向客户端和展示中心广播即可，没必要向服务端广播，单纯服务端也不需要其它的客户端的信息
 * 如果既是服务端又是客户端，那么也需要获取其它服务端的信息
 * 如果单独区分出服务方列表、调用方列表、展示中心列表，那么以后如果有其它操作的话，更加容易操作，但是维护会比较麻烦
 * 如果既是服务方又是调用方，那就要同时从两个列表中删掉，之后再广播，而不是删掉一个就广播
 * 既然广播内容只有服务方，那就只有删掉服务方时候才广播。所以要先删调用方，再删服务方，之后向存留的调用方删除服务方
 * 删除的话，是删除 host ，而不是某一个 ws
 * 注册中心和展示中心可以集成在一起，反正如果注册中心挂了，展示中心也没啥用了。缺点是没法用分布式的展示中心和注册中心了。
 * 分布式的注册中心，只需要在各个注册中心之间互相同步信息即可，这样就需要再弄一个注册中心列表
 * 这么想的话，还不如所有的功能都集成在一起，根据需要启动对应的服务即可。不然的话，反而要引用不同的库，从而需要在不同的地方做配置。
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
        // 客户端类型容器，用于在客户端断开连接时判断客户端类型。示例： { host1: { type: 'client' }, host2: { type: 'server', name: 'server-name' }, host3: { type: 'front' } }
        this.clientType = {};
        // 调用端 container.
        this.clients = {};
        // 调用端 name list.
        this.clientList = [];
        // 服务方 client container.
        this.server = {};
        // 服务方 client List. eg: { 'server1': [ip1, ip2, ip3], 'server2': [ip4, ip5, ip6] }
        this.serverList = {};
        this.serverType = {};
    }

    /**
     * 
     * @param {string} type - 客户端类型：服务方、调用方、展示中心， 可能几者都是
     * @param {string} host - 客户端地址
     * @param {string} [name] - 客户端为服务端时的服务名称
     */
    setClientType(type, host, name) {
        if (!type || !host) {
            console.warn(`type: ${type} or host: ${host} missed!`);
            return;
        }
        // switch (type) {
        //     case 'client':
        //         this.clientType[host] = { type, name };
        //         break;
        //     case 'front':
        //     case 'client':
        //         this.clientType[host] = { type };
        //         break;
        //     default:
        //         console.warn(`unexpected client type: ${type}`);
        //         break;
        // }
        this.clientType[host] = { type, name };
        return this;
    }

    /**
     * 获取客户端类型
     * @param {string} host - 客户端地址
     */
    getClientType(host) {
        return this.clientType[host].type || [];
    }

    /**
     * 删除客户端在对应列表中的数据
     * @param {string} host - 客户端地址
     */
    delClient(host) {
        let { type, name } = this.getClientType(host);
        type.forEach(val => {
            if (val === 'server') {
                this.delServer(host, name);
            }
            if (val === 'client') {
                this.delClient(host);
            }
        })

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
        if (!this.serverList[name]) {
            this.serverList[name] = [host];
        }
        else {
            if (!this.serverList[name].includes(host)) {
                this.serverList[name].push(host);
            }
        }
        this.serverType[host] = name;
        console.log(`add ${name} host: ${host}`);
        console.log(this.serverList);
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
        delete this.server[host];
        let name = this.serverType[host];
        let idx = this.serverList[name].indexOf(host);
        this.serverList[name].splice(idx, 1);
        return this;
    }

    /**
     * 向所有的客户端（包括服务端、客户端和展示中心）广播
     * @param {string} str - 广播内容，默认为所有服务端的名字和地址列表
     */
    broadcast(str) {

        str = str ? str : JSON.stringify(this.serverList);
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