var socket = io();

var output = new OscillatorOutput();
output.start();

socket.on('message', function(message, deltaTime) {

  console.log(message, deltaTime);

  if (message[0] === 144) {
    output.update(message[1], message[2]);
  } else if (message[0] === 128) {
    output.update(0, 0);
  }
});
