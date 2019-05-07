/**
 * date: 2019-5-6
 * author: lsw
 */

const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:8899');

ws.on('open', function open() {
    let msg = { type: 'server', name: 'next' };
    msg = JSON.stringify(msg);
    ws.send(msg);
});

ws.on('message', function incoming(data) {
    console.log('data: ', data);
    if (data === 'pong') {
        let msg = { type: 'heartbeat', data: 'pong' };
        msg = JSON.stringify(msg);
        ws.send(msg);
    }
});

ws.on('close', (code, reason) => {
    console.log('close: ', code, reason);
});

ws.on('error', err => {
    console.error('err: ', err);
});