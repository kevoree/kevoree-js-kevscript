'use strict';

var KevScriptError = require('../KevScriptError');

module.exports = function (model, expressions, stmt, opts) {
	return Promise.all([
		expressions[stmt.children[0].type](model, expressions, stmt.children[0], opts),
		expressions[stmt.children[1].type](model, expressions, stmt.children[1], opts)
	]).then(function (res) {
		var targetNodes = [];
		if (res[1].length === 1) {
			if (res[1][0].value === '*') {
				targetNodes = model.nodes.array;
			} else {
				var node = model.findNodesByID(res[1][0].value);
				if (node) {
					targetNodes.push(node);
				} else {
					throw new KevScriptError('Unable to find node instance "' + res[1][0].value + '". Move failed', res[1][0].pos);
				}
			}
		} else {
			throw new KevScriptError('Move target path is invalid (' + res[1].value + ')', res[1].pos);
		}

		res[0].forEach(function (instancePath) {
			if (instancePath.length === 1) {
				if (instancePath[0].value === '*') {
					throw new KevScriptError('Wildcard "*" cannot be used for nodes. Move failed', instancePath[0].pos);
				} else {
					// specific node instance to target
					var nodeToMove = model.findNodesByID(instancePath[0].value);
					if (nodeToMove) {
						targetNodes.forEach(function (node) {
							node.addHosts(nodeToMove);
							nodeToMove.host = node;
						});
					} else {
						throw new KevScriptError('Unable to move node instance "' + instancePath[0].value + '". Instance does not exist', instancePath[0].pos);
					}
				}
			} else if (instancePath.length === 2) {
				var hosts = [];
				if (instancePath[0].value === '*') {
					// all nodes
					hosts = model.nodes.array;
				} else {
					// specific node
					var node = model.findNodesByID(instancePath[0].value);
					if (node) {
						hosts.push(node);
					} else {
						throw new KevScriptError('Unable to find node instance "' + instancePath[0].value + '". Move failed', instancePath[0].pos);
					}
				}

				var components = [];
				if (instancePath[1].value === '*') {
					// all components
					hosts.forEach(function (host) {
						components = components.concat(host.components.array);
					});
				} else {
					// specific component
					hosts.forEach(function (host) {
						var comp = host.findComponentsByID(instancePath[1].value);
						if (comp) {
							components.push(comp);
						}
					});
				}

				targetNodes.forEach(function (node) {
					components.forEach(function (comp) {
						node.addComponents(comp);
					});
				});
			} else {
				throw new KevScriptError('"' + instancePath.value + '" is not a valid move path for an instance', instancePath.pos);
			}
		});
	});
};
