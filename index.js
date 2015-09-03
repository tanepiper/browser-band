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
  register: require('vision')
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

  server.views({
    engines: {
      html: require('handlebars')
    },
    relativeTo: __dirname,
    path: 'views',
    layoutPath: 'views/layout',
    helpersPath: 'views/helpers',
    layout: 'default'
  });

  var routes = [{
    method: 'GET',
    path: '/',
    handler: function(request, reply) {

      console.log(server.app.patchFiles);

      var data = {
        title: 'Browser Band',
        patchFiles: server.app.patchFiles
      };

      return reply.view('index', data);
    }
  }];

  server.route(routes);

  server.start(function (error) {
    if (error) {
      throw error;
    }
    console.log('server listening');
  });

});
