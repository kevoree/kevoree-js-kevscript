'use strict';

function getBindings(model, chan, port) {
  return model.mBindings.array.filter(function (binding) {
    if (binding.hub && binding.port) {
      if (binding.hub.name === chan.name && binding.port.path() === port.path()) {
        return binding;
      }
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
          throw new Error('Unable to find chan instance "'+target[0]+'". Unbind failed');
        }
      }
    } else {
      throw new Error('Unbind target path is invalid ('+target.join('.')+')');
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
          throw new Error('Unable to find node instance "'+portPath[0]+'". Unbind failed');
        }
      }
    } else {
      throw new Error('"'+portPath.join('.')+'" is not a valid unbind path for a port');
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
          throw new Error('Unable to find component instance "'+portPath[1]+'" in node "'+portPath[0]+'". Unbind failed');
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
            throw new Error('Component "'+comp.name+'" in node "'+comp.eContainer().name+'" has no port named "'+portPath[2]+'". Unbind failed');
          }
        }
      }
    });

    chans.forEach(function (chan) {
      ports.forEach(function (port) {
        getBindings(model, chan, port).forEach(function (binding) {
            if (binding.hub) {
              binding.hub.removeBindings(binding);
            }
            if (binding.port) {
              binding.port.removeBindings(binding);
            }
            model.removeMBindings(binding);
        });
      });
    });
  } catch (err) {
    error = err;
  } finally {
    cb(error);
  }
};
