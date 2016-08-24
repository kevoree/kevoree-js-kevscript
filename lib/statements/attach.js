'use strict';

var kevoree = require('kevoree-library');

function processFragmentDictionary(node) {
  var factory = new kevoree.factory.DefaultKevoreeFactory();
  node.groups.array.forEach(function (group) {
    var fDic = group.findFragmentDictionaryByID(node.name);
    if (!fDic) {
      fDic = factory.createFragmentDictionary();
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
            fDic = factory.createFragmentDictionary();
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
      if (target[0] === '*') {
        groups = model.groups.array;
      } else {
        var group = model.findGroupsByID(target[0]);
        if (group) {
          groups.push(group);
        } else {
          throw new Error('Unable to find group instance "'+target[0]+'". Attach failed');
        }
      }
    } else {
      throw new Error('Attach target path is invalid ('+target.join('.')+')');
    }

    nameList.forEach(function (instancePath) {
      if (instancePath.length === 1) {
        if (instancePath[0] === '*') {
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
          var node = model.findNodesByID(instancePath[0]);
          if (node) {
            groups.forEach(function (group) {
              node.addGroups(group);
              group.addSubNodes(node);
            });
            processFragmentDictionary(node);
          } else {
            throw new Error('Unable to attach node instance "'+instancePath[0]+'". Instance does not exist');
          }
        }
      } else {
        throw new Error('"'+instancePath.join('.')+'" is not a valid attach path for a node');
      }
    });
  } catch (err) {
    error = err;
  } finally {
    cb(error);
  }
};
