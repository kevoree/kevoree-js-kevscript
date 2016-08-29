'use strict';

var kevoree = require('kevoree-library');
var KevScriptError = require('../KevScriptError');

function processFragmentDictionary(node) {
  var factory = new kevoree.factory.DefaultKevoreeFactory();
  node.groups.array.forEach(function (group) {
    var fDic = group.findFragmentDictionaryByID(node.name);
    if (!fDic) {
      fDic = factory.createFragmentDictionary().withGenerated_KMF_ID(0);
      fDic.name = node.name;
      group.addFragmentDictionary(fDic);
    }
    var dicType = group.typeDefinition.dictionaryType;
    if (dicType) {
      dicType.attributes.array.forEach(function (attr) {
        if (attr.fragmentDependant && attr.defaultValue) {
          var entry = factory.createValue();
          entry.name = attr.name;
          entry.value = attr.defaultValue;
          fDic.addValues(entry);
        }
      });
    }
  });

  node.components.array.forEach(function (comp) {
    comp.provided.array.concat(comp.required.array).forEach(function (port) {
      port.bindings.array.forEach(function (binding) {
        if (binding.hub) {
          var fDic = binding.hub.findFragmentDictionaryByID(node.name);
          if (!fDic) {
            fDic = factory.createFragmentDictionary().withGenerated_KMF_ID(0);
            fDic.name = node.name;
            binding.hub.addFragmentDictionary(fDic);
          }
          var dicType = binding.hub.typeDefinition.dictionaryType;
          if (dicType) {
            dicType.attributes.array.forEach(function (attr) {
              if (attr.fragmentDependant && attr.defaultValue) {
                var entry = factory.createValue();
                entry.name = attr.name;
                entry.value = attr.defaultValue;
                fDic.addValues(entry);
              }
            });
          }
        }
      });
    });
  });
}

module.exports = function (model, statements, stmt, opts, cb) {
  var nameList = statements[stmt.children[0].type](model, statements, stmt.children[0], opts, cb);
  var target   = statements[stmt.children[1].type](model, statements, stmt.children[1], opts, cb);

  var error;
  try {
    var groups = [];
    if (target.length === 1) {
      if (target[0].value === '*') {
        groups = model.groups.array;
      } else {
        var group = model.findGroupsByID(target[0].value);
        if (group) {
          groups.push(group);
        } else {
          throw new KevScriptError('Unable to find group instance "'+target[0].value+'". Attach failed', target[0].pos);
        }
      }
    } else {
      throw new KevScriptError('Attach target path is invalid ('+target.value+')', target.pos);
    }

    nameList.forEach(function (instancePath) {
      if (instancePath.length === 1) {
        if (instancePath[0].value === '*') {
          // attach all nodes to target groups
          model.nodes.array.forEach(function (node) {
            groups.forEach(function (group) {
              node.addGroups(group);
              group.addSubNodes(node);
            });
            processFragmentDictionary(node);
          });
        } else {
          // attach a specific node to target groups
          var node = model.findNodesByID(instancePath[0].value);
          if (node) {
            groups.forEach(function (group) {
              node.addGroups(group);
              group.addSubNodes(node);
            });
            processFragmentDictionary(node);
          } else {
            throw new KevScriptError('Unable to attach node instance "'+instancePath[0].value+'". Instance does not exist', instancePath[0].pos);
          }
        }
      } else {
        throw new KevScriptError('"'+instancePath.value+'" is not a valid attach path for a node', instancePath.pos);
      }
    });
  } catch (err) {
    error = err;
  } finally {
    cb(error);
  }
};
