'use strict';

var midi = require('midi');

var registerPlugin = function (server, options, next) {

  // Set up a new input.
  var input = new midi.input();

// Count the available input ports.
  input.getPortCount();

// Get the name of a specified input port.
  input.getPortName(0);

  // Configure a callback.
  input.on('message', function(deltaTime, message) {

    server.app.websockets.forEach(function (socket) {
      socket.emit('message', message, deltaTime);
    });

    // The message is an array of numbers corresponding to the MIDI bytes:
    //   [status, data1, data2]
    // https://www.cs.cf.ac.uk/Dave/Multimedia/node158.html has some helpful
    // information interpreting the messages.
    console.log('m:' + message + ' d:' + deltaTime);
  });

// Open the first available input port.
  input.openPort(0);

  next();
};

registerPlugin.attributes = {
  name: 'midi-provider',
  version: '1.0.0',
  dependencies: []
};

module.exports = registerPlugin;
