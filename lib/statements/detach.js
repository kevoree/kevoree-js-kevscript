'use strict';

var KevScriptError = require('../KevScriptError');

function processFragmentDictionary(node) {
  node.groups.array.forEach(function (group) {
    var fDic = group.findFragmentDictionaryByID(node.name);
    if (fDic) {
      fDic.delete();
    }
  });

  node.components.array.forEach(function (comp) {
    comp.provided.array.concat(comp.required.array).forEach(function (port) {
      port.bindings.array.forEach(function (binding) {
        if (binding.hub) {
          var fDic = binding.hub.findFragmentDictionaryByID(node.name);
          if (fDic) {
            fDic.delete();
          }
        }
      });
    });
  });
}

module.exports = function (model, statements, stmt, opts, cb) {
  var nameList = statements[stmt.children[0].type](model, statements, stmt.children[0], opts);
  var target = statements[stmt.children[1].type](model, statements, stmt.children[1], opts);

  var error;
  try {
    var groups = [];
    if (target.length === 1) {
      if (target[0] === '*') {
        groups = model.groups.array;
      } else {
        var group = model.findGroupsByID(target[0]);
        if (group) {
          groups.push(group);
        } else {
          throw new KevScriptError('Unable to find group instance "'+target[0]+'". Detach failed');
        }
      }
    } else {
      throw new KevScriptError('Detach target path is invalid ('+target.join('.')+')');
    }

    nameList.forEach(function (instancePath) {
      if (instancePath.length === 1) {
        if (instancePath[0] === '*') {
          // detach all nodes to target groups
          model.nodes.array.forEach(function (node) {
            processFragmentDictionary(node);
            groups.forEach(function (group) {
              node.removeGroups(group);
              group.removeSubNodes(node);
            });
          });
        } else {
          // detach a specific node to target groups
          var node = model.findNodesByID(instancePath[0]);
          if (node) {
            processFragmentDictionary(node);
            groups.forEach(function (group) {
              node.removeGroups(group);
              group.removeSubNodes(node);
            });
          } else {
            throw new KevScriptError('Unable to detach node instance "'+instancePath[0]+'". Instance does not exist');
          }
        }
      } else {
        throw new KevScriptError('"'+instancePath.join('.')+'" is not a valid detach path for a node');
      }
    });
  } catch (err) {
    error = err;
  } finally {
    cb(error);
  }
};
