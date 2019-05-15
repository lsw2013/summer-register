
# 变量名规范

client: 客户端，指服务方或者调用方启动的 WebSocket 客户端
ws: 客户端实例。client 为泛指，作为 ws 的记录容器，ws 为实例，专用于发送信息。
service: 服务方
caller: 调用方
host: 客户端地址， eg: ip:port ，来自于 client 连接时，server 获取到的 remoteAddress 和 remotePort

# socket 通信规范
### action
action 用来配置通信类型，有下面几个类型：
1. register: 向服务端注册信息
2. getService: 向服务端请求服务信息
    2.1 type 可以是具体的 service，也可以是 'all' 来获取所有的服务方
3. heartbeat: 心跳
