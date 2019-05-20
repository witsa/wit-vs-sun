"use strict";
const express = require("express");
const http = require("http");
const WebSocket = require("ws");

const low = require("lowdb");
const lodashId = require('lodash-id')
const FileSync = require("lowdb/adapters/FileSync");
const adapter = new FileSync('db/store.json');
const db = low(adapter);
db._.mixin(lodashId);

// Set some defaults
db.defaults({ messages: [] })
  .write();

// // Add a post
// db.get('posts')
//   .insert({ title: 'lowdb is awesome' })
//   .write();

// // Set a user using Lodash shorthand syntax
// db.set('user.name', 'typicode')
//   .write();

const app = express();

//initialize a simple http server
const server = http.createServer(app);

//initialize the WebSocket server instance
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {

  //connection is up, let's add a simple simple event
  ws.on('message', (message) => {

    //log the received message and send it back to the client
    console.log('received: %s', message);

    // parse message
    var messObj = JSON.parse(message);
    messObj.dt = new Date();
    db.get('messages')
      .insert(messObj)
      .write();

    if (messObj.isBroadcast) {

      //send back the message to the other clients
      wss.clients
        .forEach(client => {
          if (client != ws) {
            client.send(JSON.stringify({ type: 'message', data: '[client] ' + messObj.data }));
          }
        });
    }
    else {
      ws.send(JSON.stringify({ type: 'message', data: '[server] ' + messObj.data }));
    }
  });

  //send immediatly a feedback to the incoming connection    
  ws.send(JSON.stringify({ type: 'connect', data: 'Hi there, I am a WebSocket server' }));
});

//start our server
server.listen(process.env.PORT || 8999, () => {
  console.log(`Server started on port ${server.address().port} :)`);
});
