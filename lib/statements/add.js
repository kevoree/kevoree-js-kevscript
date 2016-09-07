'use strict';

var kevoree = require('kevoree-library');
var KevScriptError = require('../KevScriptError');

function inflateDictionary(instance) {
  var factory = new kevoree.factory.DefaultKevoreeFactory();
  var dicType = instance.typeDefinition.dictionaryType;
  if (dicType) {
    var dic = factory.createDictionary().withGenerated_KMF_ID(0.0);
    dicType.attributes.array.forEach(function (attr) {
      if (!attr.fragmentDependant) {
        var dicEntry = factory.createValue();
        dicEntry.name = attr.name;
        dicEntry.value = attr.defaultValue;
        dic.addValues(dicEntry);
      }
    });
    instance.dictionary = dic;
  }
}

function createPorts(comp) {
  var factory = new kevoree.factory.DefaultKevoreeFactory();
  comp.typeDefinition.provided.array.forEach(function (portType) {
    var port = factory.createPort();
    port.name = portType.name;
    port.portTypeRef = portType;
    comp.addProvided(port);
  });

  comp.typeDefinition.required.array.forEach(function (portType) {
    var port = factory.createPort();
    port.name = portType.name;
    port.portTypeRef = portType;
    comp.addRequired(port);
  });
}

module.exports = function (model, statements, stmt, opts, cb) {
  var nameList;
  try {
    nameList = statements[stmt.children[0].type](model, statements, stmt.children[0], opts);
  } catch (err) {
    cb(err);
    return;
  }
  statements[stmt.children[1].type](model, statements, stmt.children[1], opts, function (err, tdef) {
    if (err) {
      cb(err);
    } else {
      var error;
      try {
        var factory = new kevoree.factory.DefaultKevoreeFactory();
        nameList.forEach(function (instancePath) {
          var instance;
          if (instancePath.length === 1) {
            // node / chan / group
            if (tdef.metaClassName() === 'org.kevoree.NodeType') {
              instance = factory.createContainerNode();
              instance.name = instancePath[0].value;
              instance.started = true;
              instance.typeDefinition = tdef;
              inflateDictionary(instance);
              model.addNodes(instance);
            } else if (tdef.metaClassName() === 'org.kevoree.GroupType') {
              instance = factory.createGroup();
              instance.name = instancePath[0].value;
              instance.started = true;
              instance.typeDefinition = tdef;
              inflateDictionary(instance);
              model.addGroups(instance);
            } else if (tdef.metaClassName() === 'org.kevoree.ChannelType') {
              instance = factory.createChannel();
              instance.name = instancePath[0].value;
              instance.started = true;
              instance.typeDefinition = tdef;
              inflateDictionary(instance);
              model.addHubs(instance);
            } else {
              throw new KevScriptError('Components must be added in nodes (eg. "add aNode.'+instancePath[0].value+': '+tdef.name+'"). "' + instancePath.value + '" is not valid', instancePath.pos);
            }

          } else if (instancePath.length === 2) {
            // component/subNode
            if (tdef.metaClassName() === 'org.kevoree.NodeType') {
              if (instancePath[0].value === '*') {
                throw new KevScriptError('Add statement with "*" only works for component type', instancePath[0].pos);
              } else {
                // add a subNode to a node
                var hostNode = model.findNodesByID(instancePath[0].value);
                if (hostNode) {
                  instance = factory.createContainerNode();
                  instance.name = instancePath[1].value;
                  instance.started = true;
                  instance.typeDefinition = tdef;
                  inflateDictionary(instance);
                  hostNode.addHosts(instance);
                  instance.host = hostNode;
                  model.addNodes(instance);
                } else {
                  throw new KevScriptError('Unable to add node "'+instancePath[1].value+'" to "'+instancePath[0].value+'". "'+instancePath[0].value+'" does not exist', instancePath[0].pos);
                }
              }
            } else if (tdef.metaClassName() === 'org.kevoree.ComponentType') {
              if (instancePath[0].value === '*') {
                // add component to all non-hosted nodes
                model.nodes.array.forEach(function (node) {
                  if (!node.host) {
                    instance = factory.createComponentInstance();
                    instance.name = instancePath[1].value;
                    instance.started = true;
                    instance.typeDefinition = tdef;
                    inflateDictionary(instance);
                    createPorts(instance);
                    node.addComponents(instance);
                  }
                });
              } else {
                // add a component to a node
                var node = model.findNodesByID(instancePath[0].value);
                if (node) {
                  instance = factory.createComponentInstance();
                  instance.name = instancePath[1].value;
                  instance.started = true;
                  instance.typeDefinition = tdef;
                  inflateDictionary(instance);
                  createPorts(instance);
                  node.addComponents(instance);
                } else {
                  throw new KevScriptError('Unable to add component "'+instancePath[1].value+'" to "'+instancePath[0].value+'". "'+instancePath[0].value+'" does not exist', instancePath[0].pos);
                }
              }
            } else {
              throw new KevScriptError('Instance "' + instancePath[1].value+ '" of type ' + tdef.metaClassName() + ' cannot be added to a node', instancePath[1].pos);
            }
          } else {
            throw new KevScriptError('Instance path for "add" statements must be "name" or "hostName.childName". Instance path "'+instancePath.value+'" is not valid', instancePath.pos);
          }
        });
      } catch (err) {
        error = err;
      } finally {
        cb(error);
      }
    }
  });
};
