'use strict';

var kevoree = require('kevoree-library');

module.exports = function (model, statements, stmt, opts, cb) {
    var networkPath = statements[stmt.children[0].type](model, statements, stmt.children[0], opts, cb);
    var value = statements[stmt.children[1].type](model, statements, stmt.children[1], opts, cb);

    var error;
    try {
      if (networkPath.length === 3) {
        var nodes = [];
        if (networkPath[0] === '*') {
          // all nodes
          nodes = model.nodes.array;
        } else {
          // specific node
          var node = model.findNodesByID(networkPath[0]);
          if (node) {
            nodes.push(node);
          } else {
            throw new Error('Unable to find node instance "'+networkPath[0]+'". Network failed');
          }
        }

        var factory = new kevoree.factory.DefaultKevoreeFactory();
        var netTypes = [];
        if (networkPath[1] === '*') {
          // all network types
          nodes.forEach(function (node) {
            netTypes = netTypes.concat(node.networkInformation.array);
          });
        } else {
          // specific network
          nodes.forEach(function (node) {
            var network = node.findNetworkInformationByID(networkPath[1]);
            if (network) {
              netTypes.push(network);
            } else {
              network = factory.createNetworkInfo();
              network.name = networkPath[1];
              node.addNetworkInformation(network);
              netTypes.push(network);
            }
          });
        }

        var netNames = [];
        if (networkPath[2] === '*') {
          // all network names
          netTypes.forEach(function (net) {
            netNames = netNames.concat(net.values.array);
          });
        } else {
          // specific network name
          netTypes.forEach(function (net) {
            var val = net.findValuesByID(networkPath[2]);
            if (val) {
              netNames.push(val);
            } else {
              val = factory.createValue();
              val.name = networkPath[2];
              net.addValues(val);
              netNames.push(val);
            }
          });
        }

        netNames.forEach(function (net) {
          net.value = value;
        });
      } else {
        throw new Error('"'+networkPath.join('.')+'" is not a network path. Network path must look like "nodeName.netType.netName"');
      }
    } catch (err) {
      error = err;
    } finally {
      cb(error);
    }
};
