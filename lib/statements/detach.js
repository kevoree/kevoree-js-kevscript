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
  var error;
  try {
    var nameList = statements[stmt.children[0].type](model, statements, stmt.children[0], opts);
    var target = statements[stmt.children[1].type](model, statements, stmt.children[1], opts);
    var groups = [];
    if (target.length === 1) {
      if (target[0].value === '*') {
        groups = model.groups.array;
      } else {
        var group = model.findGroupsByID(target[0].value);
        if (group) {
          groups.push(group);
        } else {
          throw new KevScriptError('Unable to find group instance "'+target[0].value+'". Detach failed', target[0].pos);
        }
      }
    } else {
      throw new KevScriptError('Detach target path is invalid ('+target.value+')', target.pos);
    }

    nameList.forEach(function (instancePath) {
      if (instancePath.length === 1) {
        if (instancePath[0].value === '*') {
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
          var node = model.findNodesByID(instancePath[0].value);
          if (node) {
            processFragmentDictionary(node);
            groups.forEach(function (group) {
              node.removeGroups(group);
              group.removeSubNodes(node);
            });
          } else {
            throw new KevScriptError('Unable to detach node instance "'+instancePath[0].value+'". Instance does not exist', instancePath[0].pos);
          }
        }
      } else {
        throw new KevScriptError('"'+instancePath.value+'" is not a valid detach path for a node', instancePath.pos);
      }
    });
  } catch (err) {
    error = err;
  } finally {
    cb(error);
  }
};
