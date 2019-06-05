"use strict";
const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const path = require('path');
const MessageServe = require('./message-serve');
const DB = require('./db');
const Running = require('./running');
const app = express();
var cors = require('cors');
app.use(cors());

//initialize a simple http server
const server = http.createServer(app);

//initialize the WebSocket server instance
const wss = new WebSocket.Server({ server });
var messageServe = new MessageServe(wss);
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
server.listen(process.env.PORT_WS || 12250, () => {
  console.log(`Server started on port ${server.address().port} :)`);
});


app.use('/', express.static(__dirname + '/../public'));
app.use(express.static(__dirname + '/../public'));
console.log(__dirname + '/../public');


const api = require('./api');
api.db = new DB();
api.messageServe = messageServe;
api.running = new Running(api.db, messageServe);
app.use('/api', api);

var port = process.env.port || 12251;
app.listen(port, function () {
  console.log('Appria started! ' + port + '!');
});

