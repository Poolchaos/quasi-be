var express = require('express'),
    expressApp = express(),
    socketio = require('socket.io')(server, { origins: '*:*'}),
    http = require('http'),
    server = http.createServer(expressApp),
    uuid = require('node-uuid'),
    rooms = {},
    userIds = {};
socketio.origins('*:*')

expressApp.use(express.static(__dirname + '/../public/dist/'));

exports.run = function (config) {

  server.listen(config.PORT);
  console.info('Listening on', config.PORT);

  socketio.listen(server, { log: false })
    .on('connection', function (socket) {

      var currentRoom, id;
      
      socket.on('init', function (data, fn) {
        console.info('init', { data, rooms });
        currentRoom = (data || {}).room || uuid.v4();
        var room = rooms[currentRoom];
        
        console.info('room = ', room);
        if (!data || !data.room) {
          rooms[currentRoom] = [socket];
          id = userIds[currentRoom] = 0;
          fn(currentRoom, id);
          console.info('Room created, with #', currentRoom);
        } else {
          if (!room) {
            return;
          }
          userIds[currentRoom] += 1;
          id = userIds[currentRoom];
          fn(currentRoom, id);
          room.forEach(function (s) {
            s.emit('peer.connected', { id: id });
          });
          room[id] = socket;
          console.info('Peer connected to room', currentRoom, 'with #', id);
        }
      });
      
      socket.on('connections', function (data, fn) {
        socket.emit();
      });

      socket.on('msg', function (data) {
        var to = parseInt(data.to, 10);
        if (rooms[currentRoom] && rooms[currentRoom][to]) {
          console.info('Redirecting message to', to, 'by', data.by);
          rooms[currentRoom][to].emit('msg', data);
        } else {
          console.warn('Invalid user');
        }
      });

      socket.on('disconnect', function () {
        if (!currentRoom || !rooms[currentRoom]) {
          return;
        }
        delete rooms[currentRoom][rooms[currentRoom].indexOf(socket)];
        rooms[currentRoom].forEach(function (socket) {
          if (socket) {
            socket.emit('peer.disconnected', { id: id });
          }
        });
      });
    });
};