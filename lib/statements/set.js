'use strict';

var kevoree = require('kevoree-library');
var KevScriptError = require('../KevScriptError');

function attrExistForType(dictionaryType, attrName, isFragment) {
  if (dictionaryType) {
    var type = dictionaryType.findAttributesByID(attrName);
    if (type) {
      return type.fragmentDependant === isFragment;
    }
  }
  return false;
}

function updateDictionary(dictionary, instance, attrName, value, isFragment) {
  var factory = new kevoree.factory.DefaultKevoreeFactory();
  if (attrName === '*') {
    // all attributes
    if (instance.typeDefinition.dictionaryType) {
      instance.typeDefinition.dictionaryType.attributes.array.forEach(function (attrType) {
        if (attrType.fragmentDependant === isFragment) {
          var attr = dictionary.findValuesByID(attrType.name);
          if (attr) {
            attr.value = value;
          } else {
            attr = factory.createValue();
            attr.name = attrType.name;
            attr.value = value;
            dictionary.addValues(attr);
          }
        }
      });
    }
  } else {
    // specific attribute
    var attr = dictionary.findValuesByID(attrName);
    if (attr) {
      attr.value = value;
    } else {
      // check if attribute exists in dictionary type
      if (attrExistForType(instance.typeDefinition.dictionaryType, attrName, isFragment)) {
        attr = factory.createValue();
        attr.name = attrName;
        attr.value = value;
        dictionary.addValues(attr);
      } else {
        if (isFragment) {
          throw new KevScriptError('Fragmented attribute "' + attrName + '" does not exist in type "' + instance.typeDefinition.name + '". Set failed');
        } else {
          throw new KevScriptError('Attribute "' + attrName + '" does not exist in type "' + instance.typeDefinition.name + '". Set failed');
        }
      }
    }
  }
}

module.exports = function (model, statements, stmt, opts, cb) {
  var attrPath, nodePath, value, error;
  var factory = new kevoree.factory.DefaultKevoreeFactory();
  try {
    if (stmt.children.length === 2) {
      // regular attribute
      attrPath = statements[stmt.children[0].type](model, statements, stmt.children[0], opts, cb);
      value = statements[stmt.children[1].type](model, statements, stmt.children[1], opts, cb);

      if (attrPath.length === 3) {
        model
          .select('/nodes[' + attrPath[0] + ']/components[' + attrPath[1] + ']').array
          .forEach(function (comp) {
            var dic = comp.dictionary;
            if (!dic) {
              comp.dictionary = factory.createDictionary().withGenerated_KMF_ID(0);
            }
            updateDictionary(comp.dictionary, comp, attrPath[2], value, false);
          });
      } else if (attrPath.length === 2) {
        model
          .select('/nodes[' + attrPath[0] + ']').array
          .concat(model.select('/groups[' + attrPath[0] + ']').array)
          .concat(model.select('/hubs[' + attrPath[0] + ']').array)
          .forEach(function (instance) {
            var dic = instance.dictionary;
            if (!dic) {
              instance.dictionary = factory.createDictionary().withGenerated_KMF_ID(0);
            }
            updateDictionary(instance.dictionary, instance, attrPath[1], value, false);
          });
      } else {
        throw new KevScriptError('"' + attrPath.join('.') + '" is not a valid attribute path');
      }

    } else if (stmt.children.length === 3) {
      // fragmented attribute
      attrPath = statements[stmt.children[0].type](model, statements, stmt.children[0], opts, cb);
      nodePath = statements[stmt.children[1].type](model, statements, stmt.children[1], opts, cb);
      value = statements[stmt.children[2].type](model, statements, stmt.children[2], opts, cb);

      if (attrPath.length === 3) {
        throw new KevScriptError('Setting fragmented attribute only makes sense for groups & channels. "' + attrPath.join('.') + '/' + nodePath.join('.') + '" can only refer to a component attribute. Set failed');
      } else if (attrPath.length === 2) {
        if (nodePath.length === 1) {
          model
            .select('/groups[' + attrPath[0] + ']').array
            .concat(model.select('/hubs[' + attrPath[0] + ']').array)
            .forEach(function (instance) {
              if (nodePath[0] === '*') {
                // all fragments
                instance.fragmentDictionary.array.forEach(function (fDic) {
                  updateDictionary(fDic, instance, attrPath[1], value, true);
                });
              } else {
                // specific fragment
                var fDic = instance.findFragmentDictionaryByID(nodePath[0]);
                if (fDic) {
                  updateDictionary(fDic, instance, attrPath[1], value, true);
                } else {
                  throw new KevScriptError('Unable to find fragment "' + nodePath[0] + '" for instance "' + attrPath[0] + '". Set failed');
                }
              }
            });
        } else {
          throw new KevScriptError('Invalid fragment path "' + nodePath.join('.') + '". Fragment path must be a node name. Set failed');
        }
      } else {
        throw new KevScriptError('"' + attrPath.join('.') + '" is not a valid attribute path');
      }
    }
  } catch (err) {
    error = err;
  } finally {
    cb(error);
  }
};
