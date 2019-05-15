const WebSocket = require('ws');

const wss = new WebSocket.Server({
    port: 8899
});

let clients = {},
    clientList = [];

function addClient(host, ws) {
    clients[host] = ws;
    clientList = Object.keys(clients);
}

function delClient(host) {
    delete clients[host];
    clientList = Object.keys(clients);
}

function broadcast() {
    Object.entries(clients).forEach(arr => {
        let [host, ws] = arr;
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(clientList));
        } else {
            delClient(host);
        }
    });
}

wss.on('connection', function connection(ws, req) {
    ws.on('message', function incoming(message) {
        console.log('received: %s', message);
        let {
            remoteAddress,
            remotePort
        } = req.connection;
        let host = remoteAddress + ':' + remotePort;
        // addClient(host, ws);
        // ws.send('test');
        let time = parseInt(8 - parseInt(message)) * 1000;
        setTimeout(() => {
            ws.send(message);
        }, time);
    });

    // ws.send('something');

    ws.on('close', (code, reason) => {
        let {
            remoteAddress,
            remotePort
        } = ws._socket;
        let host = remoteAddress + ':' + remotePort;
        delClient(host);
    })
});