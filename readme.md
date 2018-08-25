PoseNet Streamer is Tensorflow.js web app that streams pose data through a web socket. 

https://github.com/tensorflow/tfjs-models/tree/master/posenet


Built with Node 8.4 and NPM 5.3

Install Dependancies
------------

    yarn

Hot Development
------------

    npm run dev

Build / Run Production
------------

    npm run build
    npm run start

How to Receive Socket Data
------------

    const WebSocket = require('ws');
    
    const wsIncoming = null;
    
    const wssIncoming = new WebSocket.Server({ port: 9500 });
    
    wssIncoming.on('connection', onIncomingConnection);
    wssIncoming.on('error', onIncomingError);
    wssIncoming.on('listening', onIncomingListening);

    function onIncomingConnection(ws) {
        console.log('PoseNet Incoming Connected!');
        wsIncoming = ws;
        wsIncoming.on('error', onIncomingSocketError);
        wsIncoming.on('message', onIncomingMessage);
    }

    function onIncomingSocketError(err) {
        console.log('PoseNet Incoming Socket Error! ', err);
    }

    function onIncomingError(err) {
        console.log('PoseNet Incoming Error! ', err);
    }

    function onIncomingListening() {
        console.log('PoseNet Incoming Listening!');
    }

    function onIncomingMessage(data) {
        console.log(data);
    }