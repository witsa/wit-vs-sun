"use strict";
const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const path = require('path');
const MessageServe = require('./message-serve');
const low = require("lowdb");
const lodashId = require('lodash-id')
const FileSync = require("lowdb/adapters/FileSync");
const adapters = {
  runners: new FileSync('db/runners.json'),
  runs: new FileSync('db/runs.json'),
  bikes: new FileSync('db/bikes.json')
};
const dbs = {
  runners: low(adapters.runners),
  runs: low(adapters.runs),
  bikes: low(adapters.bikes)
};
dbs.runners._.mixin(lodashId);
dbs.runs._.mixin(lodashId);
dbs.bikes._.mixin(lodashId);

// Set some defaults
dbs.runners.defaults({ runners: [] })
  .write();
dbs.runs.defaults({ runs: [] })
  .write();
dbs.bikes.defaults({
  A: {
    name: 'A',
    runId: null
  },
  B: {
    name: 'B',
    runId: null
  }
})
  .write();

const app = express();

//initialize a simple http server
const server = http.createServer(app);

//initialize the WebSocket server instance
const wss = new WebSocket.Server({ server });
var messageServe = new MessageServe(wss, adapters);
wss.on('connection', (ws) => {

  //connection is up, let's add a simple simple event
  ws.on('message', (message) => {

    //log the received message and send it back to the client
    console.log('received: %s', message);

    // parse message
    var messObj = JSON.parse(message);
    messObj._dt = new Date();
    // db.get('messages')
    //   .insert(messObj)
    //   .write();

    if (messObj.isBroadcast) {

      //send back the message to the other clients
      wss.clients
        .forEach(client => {
          if (client != ws) {
            client.send(JSON.stringify(messObj));
          }
        });
    }
    else {
      messageServe.receive(ws, messObj);
    }
  });


  //send immediatly a feedback to the incoming connection    
  ws.send(JSON.stringify({ type: 'connect', data: 'Hi there, I am a WebSocket server' }));
});

//start our server
server.listen(8999, () => {
  console.log(`Server started on port ${server.address().port} :)`);
});


app.use('/', express.static(__dirname + '/../public'));
app.use(express.static(__dirname + '/../public'));
console.log(__dirname + '/../public');


const api = require('./api');
api.dbs = dbs;
api.wss = wss;
app.use('/api', api);

var port = process.env.port || 3210;
app.listen(port, function () {
  console.log('Appria started! ' + port + '!');
});

