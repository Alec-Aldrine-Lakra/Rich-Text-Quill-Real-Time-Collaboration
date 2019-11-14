var WebSocket = require('ws');
var WebSocketJSONStream = require('@teamwork/websocket-json-stream');
var shareDBServer = require('./sharedb-server');
var connection = shareDBServer.connect();
var uuid = require('uuid');
var doc = connection.get('examples', 'richtext'); //examples collection with id = 'richtext'
doc.fetch(function(err) {
  if (err) throw err;
  if (doc.type === null) {
    doc.create([{insert: 'Document Ready'}], 'rich-text', callback);
    return;
  }
});
//var Online = require('../model/online');

module.exports = function(server) {
  var wss = new WebSocket.Server({
    noServer: true
  });

  wss.on('connection', function(ws, req) {
    ws.id = uuid();
    ws.isAlive = true;
   
    var stream = new WebSocketJSONStream(ws);
    shareDBServer.listen(stream);

    ws.on('pong', function(data, flags) {
      ws.isAlive = true;
    });

    ws.on('error', function(error) {
        console.log('Error');
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