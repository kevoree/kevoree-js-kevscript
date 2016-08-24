'use strict';

module.exports = function (model, statements, stmt, opts, cb) {
  var nameList = statements[stmt.children[0].type](model, statements, stmt.children[0], opts, cb);
  var target   = statements[stmt.children[1].type](model, statements, stmt.children[1], opts, cb);

  var error;
  try {
    var targetNodes = [];
    if (target.length === 1) {
      if (target[0] === '*') {
        targetNodes = model.nodes.array;
      } else {
        var node = model.findNodesByID(target[0]);
        if (node) {
          targetNodes.push(node);
        } else {
          throw new Error('Unable to find node instance "'+target[0]+'". Move failed');
        }
      }
    } else {
      throw new Error('Move target path is invalid ('+target.join('.')+')');
    }

    nameList.forEach(function (instancePath) {
      if (instancePath.length === 1) {
        if (instancePath[0] === '*') {
          throw new Error('Wildcard "*" cannot be used for nodes. Move failed');
        } else {
          // specific node instance to target
          var nodeToMove = model.findNodesByID(instancePath[0]);
          if (nodeToMove) {
            targetNodes.forEach(function (node) {
              node.addHosts(nodeToMove);
              nodeToMove.host = node;
            });
          } else {
            throw new Error('Unable to move node instance "'+instancePath[0]+'". Instance does not exist');
          }
        }
      } else if (instancePath.length === 2) {
        var hosts = [];
        if (instancePath[0] === '*') {
          // all nodes
          hosts = model.nodes.array;
        } else {
          // specific node
          var node = model.findNodesByID(instancePath[0]);
          if (node) {
            hosts.push(node);
          } else {
            throw new Error('Unable to find node instance "'+instancePath[0]+'". Move failed');
          }
        }

        var components = [];
        if (instancePath[1] === '*') {
          // all components
          hosts.forEach(function (host) {
            components = components.concat(host.components.array);
          });
        } else {
          // specific component
          hosts.forEach(function (host) {
            var comp = host.findComponentsByID(instancePath[1]);
            if (comp) {
              components.push(comp);
            }
          });
        }

        targetNodes.forEach(function (node) {
          components.forEach(function (comp) {
            node.addComponents(comp);
          });
        });
      } else {
        throw new Error('"'+instancePath.join('.')+'" is not a valid move path for an instance');
      }
    });
  } catch (err) {
    error = err;
  } finally {
    cb(error);
  }
};
