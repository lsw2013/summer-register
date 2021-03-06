/**
 * date: 2019-5-8
 * author: lsw
 */

const Server = require('./server');
const { CLIENT_TYPE } = require('./constant');

exports = module.export = {
    register
};


// 客户端 socket 列表  eg: { host1: ws, host2: ws }
const client = {};
// 客户端角色类型 eg: { host1: CLIENT_TYPE.SERVICE, host2: CLIENT_TYPE.SERVICE, host3: CLIENT_TYPE.SERVICE }
// server: 1, client: 2, front: 3, serverAndClient: 4
const clientType = {};
// 服务方列表 eg: { 'service1': [host1, host2, host3], 'service2': [host4, host5, host6] }
const serviceList = {};
// 服务方服务类型 eg: { host1: 'service1', host2: 'service2' }  用于服务断开时判断是哪个服务，然后
const serviceType = {};


function register(config = { port, heartbeat }) {
    const server = new Server(config);
    server.start(msgHandler, closeHandler);
}

/**
 * 处理客户端发送来的消息
 * @param {string} host - 客户端地址
 * @param {WebSocket} ws - 客户端实例
 * @param {string} msg - 客户端消息
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

    if (!msg.action) {
        console.warn(`msg error: ${JSON.stringify(msg)}`);
        return;
    }

    // let clientTypeList = {
    //     1: 'service',
    //     2: 'caller',
    //     3: 'front',
    //     4: 'serviceAndCaller'
    // };

    // type 的取值范围： [1, 2, 3, 4]，与 CLIENT_TYPE 对应
    // name: 服务方的名称
    // data: 附加信息
    let { action, type, name, data } = msg;

    switch (action) {
        case 'register':
            setClientInfo(host, ws, msg);
            break;

        default:
            break;
    }

    // type = clientTypeList[type];
}

function setClientInfo(host, ws, msg) {

    let { type, name, data } = msg;

    // 保存客户端地址和实例的映射
    setClient(host, ws);
    // 保存客户端类型(服务方？调用方？前端？)
    setClientType(host, type);

    switch (type) {
        // 只有服务方的才需要特殊处理：1. 记录每个服务的 host 都是哪些 2. 记录每个 host 的服务是哪个
        case CLIENT_TYPE.SERVICE:
        case CLIENT_TYPE.SERVICE_AND_CALLER:
            addService(host, name);
            break;
        // 调用方注册的时候，需要发送服务方信息？  // 可以不这样
        case CLIENT_TYPE.CALLER:
            break;
        case CLIENT_TYPE.FRONT:
            break;
        default:
            console.warn(`error type: ${JSON.stringify(msg)}`);
            break;
    }
}

function addCaller(host, ws) {

}

/**
 * 添加服务方数据
 * @param {string} host - 客户端的地址
 * @param {WebSocket} ws - 客户端实例
 * @param {string} type - 客户端类型：服务方、调用方、前端展示、服务及调用方
 * @param {string} name - 服务方的服务名
 */
function addService(host, name) {
    if (serviceListAdd(name, host)) {
        serviceType[host] = name;
    }
}

/**
 * 设置客户端地址和实例关联关系
 * 1. 每次有消息进来就设置 2. 只有注册客户端的时候才设置  选哪种呢？
 * 除了注册时都会有哪些消息呢？ 1. 前端拉取信息 2. 调用方周期性地获取所有实例信息 3. 服务方周期性地回复心跳
 * 以后要添加服务方提供信息，调用方获取信息的 socket 方法，但是这些跟注册中心不会通信
 * 综上，先选择方案1，日后如果发现特别影响性能的话，再修改
 * @param {string} host - 客户端地址
 * @param {WebSocket} ws - 客户端实例
 */
function setClient(host, ws) {
    client[host] = ws;
}

/**
 * 记录客户端类型
 * @param {string} host - 客户端地址
 * @param {string} type - 客户端类型
 */
function setClientType(host, type) {
    clientType[host] = type;
};

/**
 * 向 serviceList 中添加客户端
 * @param {string} name - 客户端的服务名称
 * @param {string} host - 客户端的地址
 * @returns {boolean} 添加是否成功，不成功的话不能继续设置
 */
function serviceListAdd(name, host) {

    if (!name) {
        console.warn(`server name: ${name} invalid!`);
        return false;
    }

    let list = serviceList[name];
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