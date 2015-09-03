'use strict';

var file = require('file');
var Path = require('path');
var _ = require('lodash');

var registerPlugin = function (server, options, next) {

  server.app.websocket.on('connection', function(socket) {
    file.walk(Path.join(server.settings.connections.routes.files.relativeTo, 'patches'),
      function (error, dirPath, dirs, files) {
        if (error) {
          socket.emit('error', error);
          console.log(error);
          return;
        }

        var patchFiles = _(files)
          .filter(function (file) {
            return file.indexOf('.mp3') !== -1;
          })
          .map(function (file) {
            var tmp = file.split('/');

            var filenameCleanup = tmp[tmp.length - 1].split('.')[0];
            filenameCleanup = filenameCleanup.split(/-|_|\s/).map(function (part) { return part.replace(/-_/, '').trim(); }).join(' ');
            filenameCleanup = filenameCleanup.trim();

            return {
              library: tmp[tmp.length - 3],
              patch: tmp[tmp.length - 2],
              file: tmp[tmp.length - 1],
              name: filenameCleanup
            }
          })
          .value();

        if (patchFiles.length > 0) {
          socket.emit('patch-list', patchFiles);
        }
      }
    );
  });

  return next();
};

registerPlugin.attributes = {
  name: 'patch-finder',
  version: '1.0.0',
  dependencies: []
};

module.exports = registerPlugin;
