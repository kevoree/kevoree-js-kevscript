'use strict';

var KevScriptError = require('../KevScriptError');

module.exports = function (model, statements, stmt, opts, cb) {
  var error;
  try {
    var nameList = statements[stmt.children[0].type](model, statements, stmt.children[0], opts);
    nameList.forEach(function (instancePath) {
      var instances = [];
      if (instancePath.length === 1) {
        // node / chan / group
        instances = model.select('/nodes['+instancePath[0].value+']').array
          .concat(model.select('/groups['+instancePath[0].value+']').array)
          .concat(model.select('/hubs['+instancePath[0].value+']').array);
      } else if (instancePath.length === 2) {
        // component
        instances = model.select('/nodes['+instancePath[0].value+']/components['+instancePath[1].value+']').array;

      } else {
        throw new KevScriptError('"'+instancePath.value+'" is not a valid path for an instance. Start failed', instancePath.pos);
      }

      if (instancePath.indexOf('*') === -1 && instances.length === 0) {
        throw new KevScriptError('Unable to start "'+instancePath.value+'". Instance does not exist', instancePath.pos);
      } else {
        instances.forEach(function (instance) {
          instance.started = true;
        });
      }
    });
  } catch (err) {
    error = err;
  } finally {
    cb(error);
  }
};
