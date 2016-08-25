'use strict';

var kevoree = require('kevoree-library');
var KevScriptError = require('../KevScriptError');

function hasBinding(model, chan, port) {
  return model.mBindings.array.some(function (binding) {
    if (binding.hub && binding.port) {
      return binding.hub.name === chan.name && binding.port.path() === port.path();
    }
  });
}

module.exports = function (model, statements, stmt, opts, cb) {
  var portPath = statements[stmt.children[0].type](model, statements, stmt.children[0], opts, cb);
  var target = statements[stmt.children[1].type](model, statements, stmt.children[1], opts, cb);

  var error;
  try {
    var chans = [];
    if (target.length === 1) {
      if (target[0] === '*') {
        chans = model.hubs.array;
      } else {
        var chan = model.findHubsByID(target[0]);
        if (chan) {
          chans.push(chan);
        } else {
          throw new KevScriptError('Unable to find chan instance "'+target[0]+'". Bind failed');
        }
      }
    } else {
      throw new KevScriptError('Bind target path is invalid ('+target.join('.')+')');
    }

    var nodes = [];
    if (portPath.length === 3) {
      if (portPath[0] === '*') {
        // all nodes
        nodes = model.nodes.array;
      } else {
        // specific node
        var node = model.findNodesByID(portPath[0]);
        if (node) {
          nodes.push(node);
        } else {
          throw new KevScriptError('Unable to find node instance "'+portPath[0]+'". Bind failed');
        }
      }
    } else {
      throw new KevScriptError('"'+portPath.join('.')+'" is not a valid bind path for a port');
    }

    var components = [];
    nodes.forEach(function (node) {
      if (portPath[1] === '*') {
        // all components
        components = components.concat(node.components.array);
      } else {
        var comp = node.findComponentsByID(portPath[1]);
        if (comp) {
          components.push(comp);
        } else {
          throw new KevScriptError('Unable to find component instance "'+portPath[1]+'" in node "'+portPath[0]+'". Bind failed');
        }
      }
    });

    var ports = [];
    components.forEach(function (comp) {
      if (portPath[2] === '*') {
        // all ports
        ports = ports.concat(comp.provided.array).concat(comp.required.array);
      } else {
        var port = comp.findProvidedByID(portPath[2]);
        if (port) {
          // add input
          ports.push(port);
        } else {
          port = comp.findRequiredByID(portPath[2]);
          if (port) {
            // add output
            ports.push(port);
          } else {
            throw new KevScriptError('Component "'+comp.name+'" in node "'+comp.eContainer().name+'" has no port named "'+portPath[2]+'". Bind failed');
          }
        }
      }
    });

    var factory = new kevoree.factory.DefaultKevoreeFactory();
    chans.forEach(function (chan) {
      ports.forEach(function (port) {
        if (!hasBinding(model, chan, port)) {
          var binding = factory.createMBinding();
          binding.hub = chan;
          binding.port = port;
          chan.addBindings(binding);
          port.addBindings(binding);
          model.addMBindings(binding);
        }
      });
    });
  } catch (err) {
    error = err;
  } finally {
    cb(error);
  }
};
