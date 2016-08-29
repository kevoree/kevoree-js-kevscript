'use strict';

var kevoree = require('kevoree-library');
var KevScriptError = require('../KevScriptError');

module.exports = function (model, statements, stmt, opts, cb) {
    var networkPath = statements[stmt.children[0].type](model, statements, stmt.children[0], opts, cb);
    var value = statements[stmt.children[1].type](model, statements, stmt.children[1], opts, cb);

    var error;
    try {
      if (networkPath.length === 3) {
        var nodes = [];
        if (networkPath[0].value === '*') {
          // all nodes
          nodes = model.nodes.array;
        } else {
          // specific node
          var node = model.findNodesByID(networkPath[0].value);
          if (node) {
            nodes.push(node);
          } else {
            throw new KevScriptError('Unable to find node instance "'+networkPath[0].value+'". Network failed', networkPath[0].pos);
          }
        }

        var factory = new kevoree.factory.DefaultKevoreeFactory();
        var netTypes = [];
        if (networkPath[1].value === '*') {
          // all network types
          nodes.forEach(function (node) {
            netTypes = netTypes.concat(node.networkInformation.array);
          });
        } else {
          // specific network
          nodes.forEach(function (node) {
            var network = node.findNetworkInformationByID(networkPath[1].value);
            if (network) {
              netTypes.push(network);
            } else {
              network = factory.createNetworkInfo();
              network.name = networkPath[1].value;
              node.addNetworkInformation(network);
              netTypes.push(network);
            }
          });
        }

        var netNames = [];
        if (networkPath[2].value === '*') {
          // all network names
          netTypes.forEach(function (net) {
            netNames = netNames.concat(net.values.array);
          });
        } else {
          // specific network name
          netTypes.forEach(function (net) {
            var val = net.findValuesByID(networkPath[2].value);
            if (val) {
              netNames.push(val);
            } else {
              val = factory.createValue();
              val.name = networkPath[2].value;
              net.addValues(val);
              netNames.push(val);
            }
          });
        }

        netNames.forEach(function (net) {
          net.value = value;
        });
      } else {
        throw new KevScriptError('"'+networkPath.value+'" is not a network path. Network path must look like "nodeName.netType.netName"', networkPath[0].pos);
      }
    } catch (err) {
      error = err;
    } finally {
      cb(error);
    }
};
