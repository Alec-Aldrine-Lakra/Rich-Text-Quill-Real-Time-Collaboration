var WebSocket = require('ws');
var _ = require('lodash');
var uuid = require('uuid/v4');

module.exports = function() {
  
  var wss = new WebSocket.Server({
    noServer: true
  });

  wss.on('connection', function(ws, req) {
      
    ws.id = uuid();
    ws.isAlive = true;
    console.log(`Cursor connected at ${ws.id}`);
    ws.on('message', function(data) {
      wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN && client.id!=ws.id) {
          client.send(data);
        }
      });
    }); 

    ws.on('close', function(code, reason) {
        console.log(`Cursor closed at ${ws.id}`);
    });

    ws.on('error', function(error) {
      console.log(`Cursor error at ${ws.id}`);
    });

    ws.on('pong', function(data) {
      ws.isAlive = true;
    });

  });

  // Sockets Ping, Keep Alive
  setInterval(function() {
    wss.clients.forEach(function(ws) {
      if (ws.isAlive === false) return ws.terminate();

      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  return wss;
};