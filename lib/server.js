/**
 * date: 2019-5-8
 * author: lsw
 */

const WebSocket = require('ws');

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
 * 作为最核心的连接者，只提供连接服务，不做其他操作
 */
exports = module.exports = class Server {
    /**
     * 创建一个连接器.
     * @param {Object} config - 连接器配置
     * @param {number} [config.port=8899] - socket port
     */
    constructor(config = {}) {
        // default socket port 8899.
        this.port = parseInt(config.port) || 8899;
    }

    /**
     * 启动连接器（一个 socket 服务端）
     * @param {function} msgHandle - 收到消息时的处理方法
     * @param {function} closeHandle - 客户端断开连接时的处理方法
     */
    start(msgHandle, closeHandle) {
        this.wss = new WebSocket.Server({
            port: this.port
        });
        console.log(`server started! listening ${this.port} ...`);

        const wss = this.wss;

        wss.on('connection', function connection(ws, req) {

            let {
                remoteAddress,
                remotePort
            } = req.connection;
            let host = remoteAddress + ':' + remotePort;
            console.log(`client 【${host}】 connected!`);

            ws.on('message', function incoming(message) {
                console.log('received: %s from: %s', message, host);
                msgHandle(host, ws, message);
            });

            ws.on('close', (code, reason) => {
                console.log(`client 【${host}】 closed, code: ${code}, reason: ${reason}`);
                closeHandle(host, ws);
            });
        });

        wss.on('error', err => {
            console.error(`server start error: ${err}`);
            process.exit(1);
        });

        return this;
    }
}