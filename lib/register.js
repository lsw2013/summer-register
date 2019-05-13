/**
 * date: 2019-5-8
 * author: lsw
 */

const Server = require('./server');

exports = module.export = {
    register
};


// 服务方 socket 列表  eg: { host1: ws, host2: ws }
const server = {};
// 服务方列表 eg: { 'server1': [host1, host2, host3], 'server2': [host4, host5, host6] }
const serverList = {};
// 服务方类型 eg: { host1: 'server1', host2: 'server2' }  用于服务断开时判断是哪个服务，然后
const serverType = {};

function register(config = { port, heartbeat }) {
    const server = new Server(config);
    server.start(msgHandler, closeHandler);
}

/**
 * 
 * @param {string} host - 客户端地址
 * @param {WebSocket} ws - 客户端实例
 * @param {string} message - 客户端消息
 */
function msgHandler(host, ws, msg) {
    // 需要处理的消息类型： 服务方、调用方、展示中心、既是服务方又是调用方
    try {
        msg = JSON.parse(msg);
    }
    catch (e) {
        if (e) {
            console.error(`client msg error: ${e}`);
            msg = {};
            return;
        }
    }

    if (!msg.type) {
        console.warn(`msg error: ${JSON.stringify(msg)}`);
        return;
    }

    let { type, name, data } = msg;

    switch (type) {
        case 'server':
            addServer(ws, type, name);
            break;
        default:
            console.warn(`error type: ${JSON.stringify(msg)}`);
            break;
    }

}

/**
 * 添加服务方数据
 * @param {WebSocket} ws - 客户端实例
 * @param {string} type - 客户端类型：服务方、调用方、前端展示、服务及调用方
 * @param {string} name - 服务方的服务名
 */
function addServer(ws, type, name) {
    server[host] = ws;
    if (serverListAdd(name, host)) {
        serverType[host] = name;
    }
}

/**
 * 向 serverList 中添加客户端
 * @param {string} name - 客户端的服务名称
 * @param {string} host - 客户端的地址
 * @returns {boolean} 添加是否成功，不成功的话不能继续设置
 */
function serverListAdd(name, host) {

    if (!name) {
        console.warn(`server name: ${name} invalid!`);
        return false;
    }

    let list = serverList[name];
    if (!list) {
        list = [host];
    }
    else {
        if (!list.includes(host)) {
            list.push(host);
        }
    }

    return true;
}