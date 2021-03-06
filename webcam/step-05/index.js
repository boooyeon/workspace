'use strict';

var os = require('os');
var nodeStatic = require('node-static');
// var http = require('http');
var socketIO = require('socket.io');

const https = require('https')
const fs = require('fs')

const options = {
  key:fs.readFileSync('./private.pem'),
  cert:fs.readFileSync('./public.pem')
};

var fileServer = new(nodeStatic.Server)();
var app = https.createServer(options, (req, res) =>{
  fileServer.serve(req, res);
}).listen(3000);

console.log('Started chating server....');

// var fileServer = new(nodeStatic.Server)();
// var app = http.createServer(function(req, res) {
//   fileServer.serve(req, res);
// }).listen(8080);

var io = socketIO.listen(app);
io.sockets.on('connection', function(socket) {

  // convenience function to log server messages on the client
  function log() {
    var array = ['Message from server:'];
    array.push.apply(array, arguments);
    socket.emit('log', array);
    console.log(array)
  }

  socket.on('message', function(message) {
    log('Client said: ', message);
    console.log("안녕")
    // for a real app, would be room-only (not broadcast)
    socket.broadcast.emit('message', message);
  });

  socket.on('msg', (data) => {
    io.sockets.emit('msg', data);
    console.log(data);
    // var output = 'hello';
    // $(output).prependTo('#content');
    // $('#content').listview('refresh');
  });

  // $('#button').click(function () {
  //   socket.emit('message', {
  //     name: $('#name').val(),
  //     message: $('#message').val(),

  //     date: new Date().toUTCString()
  //   });
  // });
  

  // socket.on('msg', (data) => {
  //   io.sockets.in(roomName).emit('message', data);
  //   console.log(data);
  // });

  socket.on('create or join', function(room) {
    log('Received request to create or join room ' + room);
    console.log("create or join")
    var clientsInRoom = io.sockets.adapter.rooms[room];
    var numClients = clientsInRoom ? Object.keys(clientsInRoom.sockets).length : 0;
    log('Room ' + room + ' now has ' + numClients + ' client(s)');

    if (numClients === 0) {
      socket.join(room);
      log('Client ID ' + socket.id + ' created room ' + room);
      socket.emit('created', room, socket.id);

    } else if (numClients === 1) {
      log('Client ID ' + socket.id + ' joined room ' + room);
      io.sockets.in(room).emit('join', room);
      socket.join(room);
      socket.emit('joined', room, socket.id);
      io.sockets.in(room).emit('ready');
    } else { // max two clients
      socket.emit('full', room);
    }
  });

  socket.on('ipaddr', function() {
    console.log("ipaddr")
    var ifaces = os.networkInterfaces();
    for (var dev in ifaces) {
      ifaces[dev].forEach(function(details) {
        if (details.family === 'IPv4' && details.address !== '127.0.0.1') {
          socket.emit('ipaddr', details.address);
        }
      });
    }
  });

  socket.on('bye', function(){
    console.log('received bye');
  });

});
