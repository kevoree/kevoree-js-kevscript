'use strict';

var KevScriptError = require('../KevScriptError');

module.exports = function (model, expressions, stmt, opts) {
	var nameList = expressions[stmt.children[0].type](model, expressions, stmt.children[0], opts);
	var targetNodes = expressions[stmt.children[1].type](model, expressions, stmt.children[1], opts);

	var nodes = [];
	if (targetNodes.length === 1) {
		nodes = model.select('/nodes[' + targetNodes[0] + ']').array;

		if (targetNodes[0] !== '*' && nodes.length === 0) {
			throw new KevScriptError('Unable to find any node instance named "' + targetNodes[0] + '". Move failed', stmt.children[1].pos);
		}
	} else {
		throw new KevScriptError('Move target path is invalid (' + targetNodes.join('.') + ')', stmt.children[1].pos);
	}

	nameList.forEach(function (instancePath) {
		if (instancePath.length === 1) {
			if (instancePath[0] === '*') {
				throw new KevScriptError('Wildcard "*" cannot be used for nodes. Move failed', instancePath[0].pos);
			} else {
				// specific node instance to target
				var nodeToMove = model.findNodesByID(instancePath[0]);
				if (nodeToMove) {
					nodes.forEach(function (node) {
						node.addHosts(nodeToMove);
						nodeToMove.host = node;
					});
				} else {
					throw new KevScriptError('Unable to move node instance "' + instancePath[0] + '". Instance does not exist', instancePath[0].pos);
				}
			}
		} else if (instancePath.length === 2) {
			var hosts = [];
			if (instancePath[0] === '*') {
				// all nodes
				hosts = model.nodes.array;
			} else {
				// specific node
				var node = model.findNodesByID(instancePath[0]);
				if (node) {
					hosts.push(node);
				} else {
					throw new KevScriptError('Unable to find node instance "' + instancePath[0] + '". Move failed', instancePath[0].pos);
				}
			}

			var components = [];
			if (instancePath[1] === '*') {
				// all components
				hosts.forEach(function (host) {
					components = components.concat(host.components.array);
				});
			} else {
				// specific component
				hosts.forEach(function (host) {
					var comp = host.findComponentsByID(instancePath[1]);
					if (comp) {
						components.push(comp);
					}
				});
			}

			nodes.forEach(function (node) {
				components.forEach(function (comp) {
					node.addComponents(comp);
				});
			});
		} else {
			throw new KevScriptError('"' + instancePath.value + '" is not a valid move path for an instance', instancePath.pos);
		}
	});
};
