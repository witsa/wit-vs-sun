class MessageServe {

   constructor(wss, addapters) {
     this.wss = wss;
     this.addapters = addapters;
   }

   receive(ws, messageObj) {
     ws.send(JSON.stringify({ type: 'message', data: '[server] ' + messageObj.data }));
   }
}

module.exports = MessageServe;