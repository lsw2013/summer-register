
# 变量名规范

client: 客户端，指服务方或者调用方启动的 WebSocket 客户端
ws: 客户端实例。client 为泛指，作为 ws 的记录容器，ws 为实例，专用于发送信息。
service: 服务方
caller: 调用方
host: 客户端地址， eg: ip:port ，来自于 client 连接时，server 获取到的 remoteAddress 和 remotePort
