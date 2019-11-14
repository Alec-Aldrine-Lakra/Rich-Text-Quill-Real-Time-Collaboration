var http = require('http');
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/test', {useNewUrlParser: true, useUnifiedTopology: true });
var express = require('express');
const url = require('url');
var app = express();
var cors = require('cors');
app.use(express.static('static'));
app.use(express.static('node_modules/quill/dist'));
app.use(require('./controller/login'));
app.use(cors());
var server = http.createServer(app);
var wssShareDB = require('./helpers/wss-sharedb')(server);
var wssCursors = require('./helpers/wss-cursors')(server);
var io = require('socket.io');

// Connect any incoming WebSocket connection to ShareDB
server.on('upgrade', (request, socket, head) => {
  const pathname = url.parse(request.url).pathname;
  if (pathname === '/sharedb') {
      wssShareDB.handleUpgrade(request, socket, head, (ws) => {
        wssShareDB.emit('connection', ws);
      });
    } else if (pathname === '/cursors') {
      wssCursors.handleUpgrade(request, socket, head, (ws) => {
        wssCursors.emit('connection', ws);
      });
    } else {
      socket.destroy();
    }
});

server.listen(8080);
console.log('Listening on http://localhost:8080');
