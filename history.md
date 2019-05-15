
# 思路

### 2019年5月15日
看了下 eureka 的方案，忽然感觉不需要区分什么服务方调用方的，它们自己协调不就好了。。。我只要保证连接上来的客户端能获取到需要的服务就行
连接上来的时候，每个客户端都要给自己一个服务名，一个实例名称，这样的话，管它是什么端呢？
作为服务方，注册上来就行了，其它的不用管
作为调用方，注册上来，能获取到需要的服务方的信息就好了，其它不用管
全都用 socket 通信，要做什么类型的操作都用 action 来设置
这样的话，client 的信息要多记录一些，注册的时候也要多一些信息
```javascript
client = {
    host1: ws
}
clientType = {
    host1: {
        application,  // 服务名
        host(ip?),  // 主机信息
        port,  // 服务端口
        httpsPort,  // https 端口
        statusPageUrl,  // 服务信息地址（需要 get 类型）
    }
}
```
客户端可以使用 client.getService('serviceName', 'router', ...args) 调用服务方信息
启动的时候每个客户端都启动一个 socket server，同时将提供给外部的服务使用 client.route('xxx', function) 的形式来配置服务
客户端发送 client.getService 的时候，获取到的 service 回复，每次

**需要把事件转为异步 Promise 形式，要不然 api 太恶心了。。。**