/**
 * date: 2019-5-6
 * author: lsw
 */

const WebSocket = require('ws');

const ws = new WebSocket('ws://192.168.141.211:8899');

ws.on('open', function open() {
    ws.send('something');
});

ws.on('message', function incoming(data) {
    console.log(data);
    if (data === 'pong') {
        ws.send('pang');
    }
});