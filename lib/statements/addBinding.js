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
      if (target[0].value === '*') {
        chans = model.hubs.array;
      } else {
        var chan = model.findHubsByID(target[0].value);
        if (chan) {
          chans.push(chan);
        } else {
          throw new KevScriptError('Unable to find chan instance "'+target[0].value+'". Bind failed', target[0].pos);
        }
      }
    } else {
      throw new KevScriptError('Bind target path is invalid ('+target.value+')', target.pos);
    }

    var nodes = [];
    if (portPath.length === 3) {
      if (portPath[0].value === '*') {
        // all nodes
        nodes = model.nodes.array;
      } else {
        // specific node
        var node = model.findNodesByID(portPath[0].value);
        if (node) {
          nodes.push(node);
        } else {
          throw new KevScriptError('Unable to find node instance "'+portPath[0].value+'". Bind failed', portPath[0].pos);
        }
      }
    } else {
      throw new KevScriptError('"'+portPath.value+'" is not a valid bind path for a port', portPath.pos);
    }

    var components = [];
    nodes.forEach(function (node) {
      if (portPath[1].value === '*') {
        // all components
        components = components.concat(node.components.array);
      } else {
        var comp = node.findComponentsByID(portPath[1].value);
        if (comp) {
          components.push(comp);
        } else {
          throw new KevScriptError('Unable to find component instance "'+portPath[1].value+'" in node "'+portPath[0].value+'". Bind failed', portPath[1].pos);
        }
      }
    });

    var ports = [];
    components.forEach(function (comp) {
      if (portPath[2].value === '*') {
        // all ports
        ports = ports.concat(comp.provided.array).concat(comp.required.array);
      } else {
        var port = comp.findProvidedByID(portPath[2].value);
        if (port) {
          // add input
          ports.push(port);
        } else {
          port = comp.findRequiredByID(portPath[2].value);
          if (port) {
            // add output
            ports.push(port);
          } else {
            throw new KevScriptError('Component "'+comp.name+'" in node "'+comp.eContainer().name+'" has no port named "'+portPath[2].value+'". Bind failed', portPath[2].pos);
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
