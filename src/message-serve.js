const redy = require('./redy');


class MessageServe {

  constructor(wss) {
    this.wss = wss;
  }

  broadcast(type, data) {
    this.wss.clients.forEach(ws => ws.send(JSON.stringify({ type: type, data: data })));
  }

  receive(ws, messageObj) {
    ws.send(JSON.stringify({ type: 'message', data: '[server] ' + messageObj.data }));
  }

  broadcastData(name, data) {
    this.broadcast(`data:${name}`, data)
  }

  broadcastA(data) {
    this.broadcastData('a', data)
  }

  broadcastB(data) {
    this.broadcastData('b', data)
  }
  broadcastSun(data) {
    this.broadcastData('sun', data)
  }
}

module.exports = MessageServe;