'use strict';

var io = require('socket.io');
var _ = require('lodash');

var registerPlugin = function (server, options, next) {

  server.app.websockets = [];

  server.app.websocket = io(server.listener);

  server.app.websocket.on('connection', function (socket) {
    console.log('user connected');
    server.app.websockets.push(socket);

    socket.on('disconnect', function() {
      _.remove(server.app.websockets, {id: socket.id});
      console.log('user disconnected', server.app.websockets.length);
    });
  });
  return next();
};

registerPlugin.attributes = {
  name: 'socket-provider',
  version: '1.0.0',
  dependencies: []
};

module.exports = registerPlugin;
