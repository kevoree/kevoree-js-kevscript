'use strict';

var kevoree = require('kevoree-library');

function inflateDictionary(instance) {
  var factory = new kevoree.factory.DefaultKevoreeFactory();
  var dicType = instance.typeDefinition.dictionaryType;
  if (dicType) {
    var dic = factory.createDictionary().withGenerated_KMF_ID(0);
    dicType.attributes.array.forEach(function (attr) {
      if (!attr.fragmentDependant && attr.defaultValue) {
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
  var factory = new kevoree.factory.DefaultKevoreeFactory();
  var nameList = statements[stmt.children[0].type](model, statements, stmt.children[0], opts);
  statements[stmt.children[1].type](model, statements, stmt.children[1], opts, function (err, tdef) {
    if (err) {
      cb(err);
    } else {
      var error;
      try {
        nameList.forEach(function (instancePath) {
          var instance;
          if (instancePath.length === 1) {
            // node / chan / group
            if (tdef.metaClassName() === 'org.kevoree.NodeType') {
              instance = factory.createContainerNode();
              instance.name = instancePath[0];
              instance.started = true;
              instance.typeDefinition = tdef;
              inflateDictionary(instance);
              model.addNodes(instance);
            } else if (tdef.metaClassName() === 'org.kevoree.GroupType') {
              instance = factory.createGroup();
              instance.name = instancePath[0];
              instance.started = true;
              instance.typeDefinition = tdef;
              inflateDictionary(instance);
              model.addGroups(instance);
            } else if (tdef.metaClassName() === 'org.kevoree.ChannelType') {
              instance = factory.createChannel();
              instance.name = instancePath[0];
              instance.started = true;
              instance.typeDefinition = tdef;
              inflateDictionary(instance);
              model.addHubs(instance);
            } else {
              throw new Error('Unable to find a node, channel or group with name "' + instancePath + '"');
            }

          } else if (instancePath.length === 2) {
            // component/subNode
            if (tdef.metaClassName() === 'org.kevoree.NodeType') {
              if (instancePath[0] === '*') {
                throw new Error('Add statement with "*" only works for component type');
              } else {
                // add a subNode to a node
                var hostNode = model.findNodesByID(instancePath[0]);
                if (hostNode) {
                  instance = factory.createContainerNode();
                  instance.name = instancePath[1];
                  instance.started = true;
                  instance.typeDefinition = tdef;
                  inflateDictionary(instance);
                  hostNode.addHosts(instance);
                  instance.host = hostNode;
                  model.addNodes(instance);
                } else {
                  throw new Error('Unable to add node "'+instancePath[1]+'" to "'+instancePath[0]+'". "'+instancePath[0]+'" does not exist');
                }
              }
            } else if (tdef.metaClassName() === 'org.kevoree.ComponentType') {
              if (instancePath[0] === '*') {
                // add component to all non-hosted nodes
                model.nodes.array.forEach(function (node) {
                  if (!node.host) {
                    instance = factory.createComponentInstance();
                    instance.name = instancePath[1];
                    instance.started = true;
                    instance.typeDefinition = tdef;
                    inflateDictionary(instance);
                    createPorts(instance);
                    node.addComponents(instance);
                  }
                });
              } else {
                // add a component to a node
                var node = model.findNodesByID(instancePath[0]);
                if (node) {
                  instance = factory.createComponentInstance();
                  instance.name = instancePath[1];
                  instance.started = true;
                  instance.typeDefinition = tdef;
                  inflateDictionary(instance);
                  createPorts(instance);
                  node.addComponents(instance);
                } else {
                  throw new Error('Unable to add component "'+instancePath[1]+'" to "'+instancePath[0]+'". "'+instancePath[0]+'" does not exist');
                }
              }
            } else {
              throw new Error('Instance "' + instancePath[1]+ '" of type ' + tdef.metaClassName() + ' cannot be added to a node');
            }
          } else {
            throw new Error('Instance path for "add" statements must be "name" or "hostName.childName". Instance path "'+instancePath.join('.')+'" is not valid');
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
