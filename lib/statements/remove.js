'use strict';

var KevScriptError = require('../KevScriptError');

module.exports = function (model, statements, stmt, opts, cb) {
  var nameList = statements[stmt.children[0].type](model, statements, stmt.children[0], opts, cb);

  function removeNode(node) {
    // remove groups fragment dictionary related to this node
    model.groups.array.forEach(function (group) {
      var dic = group.findFragmentDictionaryByID(node.name);
      if (dic) {
        group.removeFragmentDictionary(dic);
      }
    });

    // remove channels fragment dictionary related to this node
    model.hubs.array.forEach(function (hub) {
      var dic = hub.findFragmentDictionaryByID(node.name);
      if (dic) {
        hub.removeFragmentDictionary(dic);
      }
    });

    // remove bindings related to this node
    node.components.array.forEach(function (comp) {
      comp.provided.array.concat(comp.required.array).forEach(function (port) {
        port.bindings.array.forEach(function (binding) {
          binding.hub.removeBindings(binding);
          model.removeMBindings(binding);
        });
      });
    });

    // delete links with groups
    node.groups.array.forEach(function (group) {
      group.removeSubNodes(node);
    });

    // remove node itself
    if (node.host) {
      node.host.removeHosts(node);
    }
    model.removeNodes(node);
  }

  function removeGroup(group) {
    // remove link between this group and nodes
    group.subNodes.array.forEach(function (node) {
      node.removeGroups(group);
    });
    // remove group
    model.removeGroups(group);
  }

  function removeChannel(chan) {
    model.mBindings.array.forEach(function (binding) {
      if (binding.hub.name === chan.name) {
        if (binding.port) {
          binding.port.removeBindings(binding);
        }
        if (binding.hub) {
          binding.hub.removeBindings(binding);
        }
        model.removeMBindings(binding);
      }
    });
    model.removeHubs(chan);
  }

  function removeComponent(comp) {
    comp.provided.array.concat(comp.required.array).forEach(function (port) {
      port.bindings.array.forEach(function (binding) {
        if (binding.port) {
          binding.port.removeBindings(binding);
        }
        if (binding.hub) {
          binding.hub.removeBindings(binding);
        }
        model.removeMBindings(binding);
      });
    });
    comp.eContainer().removeComponents(comp);
  }

  function removeFromNode(path, node) {
    if (path === '*') {
      // remove all from all nodes
      node.components.array.forEach(removeComponent);
      node.hosts.array.forEach(removeNode);
    } else {
      // remove a specific instance from all nodes
      var comp = node.findComponentsByID(path);
      if (comp) {
        removeComponent(comp);
      }
      var subNode = node.findHostsByID(path);
      if (subNode){
        removeNode(subNode);
      }
    }
  }

  var error;
  try {
    nameList.forEach(function (instancePath) {
      var instance;
      if (instancePath.length === 1) {
        if (instancePath[0] === '*') {
          // remove all
          model.removeAllHubs();
          model.removeAllNodes();
          model.removeAllGroups();
          model.removeAllMBindings();
        } else {
          // path to a node / chan / group
          var instances = model.nodes.array
            .concat(model.hubs.array)
            .concat(model.groups.array);
          for (var i=0; i < instances.length; i++) {
            if (instances[i].name === instancePath[0]) {
              instance = instances[i];
              break;
            }
          }
          if (instance) {
            if (instance.metaClassName() === 'org.kevoree.ContainerNode') {
              removeNode(instance);
            } else if (instance.metaClassName() === 'org.kevoree.Group') {
              removeGroup(instance);
            } else if (instance.metaClassName() === 'org.kevoree.Channel') {
              removeChannel(instance);
            }
          } else {
            throw new KevScriptError('Unable to remove instance "'+instancePath[0]+'". Instance does not exist');
          }
        }

      } else if (instancePath.length === 2) {
        // path to a component/subNode
        if (instancePath[0] === '*') {
          // remove from all nodes
          model.nodes.array.forEach(function (node) {
            removeFromNode(instancePath[1], node);
          });
        } else {
          // remove from a specific node
          var hostNode = model.findNodesByID(instancePath[0]);
          if (hostNode) {
            removeFromNode(instancePath[1], hostNode);
          } else {
            throw new KevScriptError('Unable to remove instances from "'+instancePath[0]+'". Instance does not exist');
          }
        }

      } else {
         throw new KevScriptError('Instance path for "remove" statements must be "name" or "hostName.childName". Instance path "'+instancePath.join('.')+'" is not valid');
      }
    });
  } catch (err) {
    error = err;
  } finally {
    cb(error);
  }
};
