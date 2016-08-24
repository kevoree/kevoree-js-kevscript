'use strict';

var kevoree = require('kevoree-library');

function updateDictionary(instance, attrName) {
  var factory = new kevoree.factory.DefaultKevoreeFactory();
  if (instance.typeDefinition.dictionaryType) {
    if (!instance.dictionary) {
      instance.dictionary = factory.createDictionary().withGenerated_KMF_ID(0);
    }
    var attrTypes = instance.typeDefinition.dictionaryType.select('attributes[' + attrName + ']').array;
    if (attrTypes.length === 0) {
      throw new Error('Attribute "' + attrName + '" does not exist in type "' + instance.typeDefinition.name + '". Set failed');
    } else {
      attrTypes.forEach(function (attrType) {
        if (!attrType.fragmentDependant) {
          var attr = factory.createValue();
          attr.name = attrType.name;
          instance.dictionary.addValues(attr);
        } else {
          throw new Error('Attribute "'+attrType.name+'" in "'+instance.typeDefinition.name+'" must be set with a fragment. Set failed');
        }
      });
    }
  } else {
    throw new Error('Attribute "' + attrName + '" does not exist in type "' + instance.typeDefinition.name + '". Set failed');
  }
}

function updateFragmentDictionary(dic, instance, attrName) {
  var factory = new kevoree.factory.DefaultKevoreeFactory();
  if (instance.typeDefinition.dictionaryType) {
    var attrTypes = instance.typeDefinition.dictionaryType.select('attributes[' + attrName + ']').array;
    if (attrTypes.length === 0) {
      throw new Error('Fragmented attribute "' + attrName + '" does not exist in type "' + instance.typeDefinition.name + '". Set failed');
    } else {
      attrTypes.forEach(function (attrType) {
        if (attrType.fragmentDependant) {
          var attr = factory.createValue();
          attr.name = attrType.name;
          dic.addValues(attr);
        } else {
          throw new Error('Fragmented attribute "'+attrType.name+'" in "'+instance.typeDefinition.name+'" is not fragmented. Set failed');
        }
      });
    }
  } else {
    throw new Error('Fragmented attribute "' + attrName + '" does not exist in type "' + instance.typeDefinition.name + '". Set failed');
  }
}

module.exports = function (model, statements, stmt, opts, cb) {
  var attrPath, nodePath, value, error;
  try {
    var attributes = [];
    if (stmt.children.length === 2) {
      // regular attribute
      attrPath = statements[stmt.children[0].type](model, statements, stmt.children[0], opts, cb);
      value = statements[stmt.children[1].type](model, statements, stmt.children[1], opts, cb);

      if (attrPath.length === 3) {
        model
          .select('/nodes[' + attrPath[0] + ']/components[' + attrPath[1] + ']').array
          .forEach(function (comp) {
            updateDictionary(comp, attrPath[2]);
            if (comp.dictionary) {
              attributes = attributes.concat(comp.dictionary.values.array);
            }
          });
      } else if (attrPath.length === 2) {
        model
          .select('/nodes[' + attrPath[0] + ']').array
          .concat(model.select('/groups[' + attrPath[0] + ']').array)
          .concat(model.select('/hubs[' + attrPath[0] + ']').array)
          .forEach(function (instance) {
            updateDictionary(instance, attrPath[1]);
            if (instance.dictionary) {
              attributes = attributes.concat(instance.dictionary.values.array);
            }
          });
      } else {
        throw new Error('"' + attrPath.join('.') + '" is not a valid attribute path');
      }

      if (attributes.length === 0) {
        throw new Error('Unable to find attribute "' + attrPath.join('.') + '". Set failed');
      } else {
        attributes.forEach(function (attr) {
          attr.value = value;
        });
      }

    } else if (stmt.children.length === 3) {
      // fragmented attribute
      attrPath = statements[stmt.children[0].type](model, statements, stmt.children[0], opts, cb);
      nodePath = statements[stmt.children[1].type](model, statements, stmt.children[1], opts, cb);
      value = statements[stmt.children[2].type](model, statements, stmt.children[2], opts, cb);

      if (attrPath.length === 3) {
        throw new Error('Setting fragmented attribute only makes sense for groups & channels. "' + attrPath.join('.') + '/' + nodePath.join('.') + '" can only refer to a component attribute. Set failed');
      } else if (attrPath.length === 2) {
        if (nodePath.length === 1) {
          model
            .select('/groups[' + attrPath[0] + ']').array
            .concat(model.select('/hubs[' + attrPath[0] + ']').array)
            .forEach(function (instance) {
              if (nodePath[0] === '*') {
                // all fragments
                instance.fragmentDictionary.array.forEach(function (fDic) {
                  updateFragmentDictionary(fDic, instance, attrPath[1]);
                  attributes = attributes.concat(fDic.values.array);
                });
              } else {
                // specific fragment
                var fDic = instance.findFragmentDictionaryByID(nodePath[0]);
                if (fDic) {
                  updateFragmentDictionary(fDic, instance, attrPath[1]);
                  attributes = attributes.concat(fDic.values.array);
                } else {
                  throw new Error('Unable to find fragment "'+nodePath[0]+'" for instance "'+attrPath[0]+'". Set failed');
                }
              }
            });
        } else {
          throw new Error('Invalid fragment path "'+nodePath.join('.')+'". Fragment path must be a node name. Set failed');
        }
      } else {
        throw new Error('"' + attrPath.join('.') + '" is not a valid attribute path');
      }

      if (attributes.length === 0) {
        throw new Error('Unable to find fragmented attribute "' + attrPath.join('.') + '/'+nodePath[0]+'". Set failed');
      } else {
        attributes.forEach(function (attr) {
          attr.value = value;
        });
      }
    }
  } catch (err) {
    error = err;
  } finally {
    cb(error);
  }
};
