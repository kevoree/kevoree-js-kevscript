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

function updateDictionary(dictionary, instance, attrStmt, value, isFragment) {
  var factory = new kevoree.factory.DefaultKevoreeFactory();
  if (attrStmt.value === '*') {
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
    var attr = dictionary.findValuesByID(attrStmt.value);
    if (attr) {
      attr.value = value;
    } else {
      // check if attribute exists in dictionary type
      if (attrExistForType(instance.typeDefinition.dictionaryType, attrStmt.value, isFragment)) {
        attr = factory.createValue();
        attr.name = attrStmt.value;
        attr.value = value;
        dictionary.addValues(attr);
      } else {
        if (isFragment) {
          throw new KevScriptError('Fragmented attribute "' + attrStmt.value + '" does not exist in type "' + instance.typeDefinition.name + '". Set failed', attrStmt.pos);
        } else {
          throw new KevScriptError('Attribute "' + attrStmt.value + '" does not exist in type "' + instance.typeDefinition.name + '". Set failed', attrStmt.pos);
        }
      }
    }
  }
}

module.exports = function (model, statements, stmt, opts, cb) {
  var attrPath, nodePath, valueStmt, error, instances;
  var factory = new kevoree.factory.DefaultKevoreeFactory();
  try {
    if (stmt.children.length === 2) {
      // regular attribute
      attrPath = statements[stmt.children[0].type](model, statements, stmt.children[0], opts, cb);
      valueStmt = statements[stmt.children[1].type](model, statements, stmt.children[1], opts, cb);

      if (attrPath.length === 3) {
        var nodes = model.select('/nodes[' + attrPath[0].value + ']').array;
        if (attrPath[0].value !== '*' && nodes.length === 0) {
          throw new KevScriptError('There is no node named "'+attrPath[0].value+'". Set failed', attrPath[0].pos);
        }
        instances = [];
        nodes.forEach(function (node) {
          var comps = node.select('components['+attrPath[1].value+']').array;
          if (attrPath[1].value !== '*' && comps.length === 0) {
            throw new KevScriptError('There is no component named "'+attrPath[1].value+'" in node "'+attrPath[0].value+'". Set failed', attrPath[1].pos);
          }
          instances = instances.concat(comps);
        });

        instances.forEach(function (comp) {
            var dic = comp.dictionary;
            if (!dic) {
              comp.dictionary = factory.createDictionary().withGenerated_KMF_ID(0.0);
            }
            updateDictionary(comp.dictionary, comp, attrPath[2], valueStmt.value, false);
          });
      } else if (attrPath.length === 2) {
        instances = model
            .select('/nodes[' + attrPath[0].value + ']').array
            .concat(model.select('/groups[' + attrPath[0].value + ']').array)
            .concat(model.select('/hubs[' + attrPath[0].value + ']').array);

        if (attrPath[0].value !== '*' && instances.length === 0) {
          throw new KevScriptError('There is no node, group or channel instance named "'+attrPath[0].value+'". Set failed', attrPath[0].pos);
        }

        instances.forEach(function (instance) {
            var dic = instance.dictionary;
            if (!dic) {
              instance.dictionary = factory.createDictionary().withGenerated_KMF_ID(0.0);
            }
            updateDictionary(instance.dictionary, instance, attrPath[1], valueStmt.value, false);
          });
      } else {
        throw new KevScriptError('"' + attrPath.value + '" is not a valid attribute path', attrPath.pos);
      }

    } else if (stmt.children.length === 3) {
      // fragmented attribute
      attrPath = statements[stmt.children[0].type](model, statements, stmt.children[0], opts, cb);
      nodePath = statements[stmt.children[1].type](model, statements, stmt.children[1], opts, cb);
      valueStmt = statements[stmt.children[2].type](model, statements, stmt.children[2], opts, cb);

      if (attrPath.length === 3) {
        throw new KevScriptError('Setting fragmented attribute only makes sense for groups & channels. "' + attrPath.value + '/' + nodePath.value + '" can only refer to a component attribute. Set failed', attrPath.pos);
      } else if (attrPath.length === 2) {
        if (nodePath.length === 1) {
          instances = model
            .select('/groups[' + attrPath[0].value + ']').array
            .concat(model.select('/hubs[' + attrPath[0].value + ']').array);

          if (instances.length === 0 && attrPath[0].value !== '*') {
            throw new KevScriptError('There is no group or channel instance named "'+attrPath[0].value+'". Set failed', attrPath[0].pos);
          }

          instances.forEach(function (instance) {
              if (nodePath[0] === '*') {
                // all fragments
                instance.fragmentDictionary.array.forEach(function (fDic) {
                  updateDictionary(fDic, instance, attrPath[1], valueStmt.value, true);
                });
              } else {
                // specific fragment
                var fDic = instance.findFragmentDictionaryByID(nodePath[0].value);
                if (fDic) {
                  updateDictionary(fDic, instance, attrPath[1], valueStmt.value, true);
                } else {
                  throw new KevScriptError('Unable to find fragment "' + nodePath[0].value + '" for instance "' + attrPath[0].value + '". Set failed', nodePath[0].pos);
                }
              }
            });
        } else {
          throw new KevScriptError('Invalid fragment path "' + nodePath.value + '". Fragment path must be a node name. Set failed', nodePath.pos);
        }
      } else {
        throw new KevScriptError('"' + attrPath.value + '" is not a valid attribute path', attrPath.pos);
      }
    }
  } catch (err) {
    error = err;
  } finally {
    cb(error);
  }
};
