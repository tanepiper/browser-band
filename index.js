var Hapi = require('hapi');
var Request = require('request');
var Path = require('path');

var server = new Hapi.Server({
  connections: {
    routes: {
      files: {
        relativeTo: Path.join(__dirname, 'public')
      }
    }
  }
});

server.connection({ port: 9000 });

server.register([{
  register: require('inert')
}, {
  register: require(Path.join(__dirname, 'plugins/static-provider'))
}, {
  register: require(Path.join(__dirname, 'plugins/socket-provider'))
}, {
  register: require(Path.join(__dirname, 'plugins/midi-provider'))
}, {
  register: require(Path.join(__dirname, 'plugins/patch-finder'))
}], function(error) {
  if (error) {
    throw error;
  }
});

server.start(function (error) {
  if (error) {
    throw error;
  }
  console.log('server listening');
});
