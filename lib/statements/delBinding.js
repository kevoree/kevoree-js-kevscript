'use strict';

var KevScriptError = require('../KevScriptError');

function getBindings(model, chan, port) {
	return model.mBindings.array.filter(function (binding) {
		if (binding.hub && binding.port) {
			if (binding.hub.name === chan.name && binding.port.path() === port.path()) {
				return binding;
			}
		}
	});
}

module.exports = function (model, expressions, stmt, opts) {
	return Promise.all([
		expressions[stmt.children[0].type](model, expressions, stmt.children[0], opts),
		expressions[stmt.children[1].type](model, expressions, stmt.children[1], opts)
	]).then(function (res) {
		var chans = [];
		if (res[1].length === 1) {
			if (res[1][0].value === '*') {
				chans = model.hubs.array;
			} else {
				var chan = model.findHubsByID(res[1][0].value);
				if (chan) {
					chans.push(chan);
				} else {
					throw new KevScriptError('Unable to find chan instance "' + res[1][0].value + '". Unbind failed', res[1][0].pos);
				}
			}
		} else {
			throw new KevScriptError('Unbind target path is invalid (' + res[1].value + ')', res[1].pos);
		}

		var nodes = [];
		if (res[0].length === 3) {
			if (res[0][0].value === '*') {
				// all nodes
				nodes = model.nodes.array;
			} else {
				// specific node
				var node = model.findNodesByID(res[0][0].value);
				if (node) {
					nodes.push(node);
				} else {
					throw new KevScriptError('Unable to find node instance "' + res[0][0].value + '". Unbind failed', res[0][0].pos);
				}
			}
		} else {
			throw new KevScriptError('"' + res[0].value + '" is not a valid unbind path for a port', res[0].pos);
		}

		var components = [];
		nodes.forEach(function (node) {
			if (res[0][1].value === '*') {
				// all components
				components = components.concat(node.components.array);
			} else {
				var comp = node.findComponentsByID(res[0][1].value);
				if (comp) {
					components.push(comp);
				} else {
					throw new KevScriptError('Unable to find component instance "' + res[0][1].value + '" in node "' + res[0][0].value + '". Unbind failed', res[0][1].pos);
				}
			}
		});

		var ports = [];
		components.forEach(function (comp) {
			if (res[0][2].value === '*') {
				// all ports
				ports = ports.concat(comp.provided.array).concat(comp.required.array);
			} else {
				var port = comp.findProvidedByID(res[0][2].value);
				if (port) {
					// add input
					ports.push(port);
				} else {
					port = comp.findRequiredByID(res[0][2].value);
					if (port) {
						// add output
						ports.push(port);
					} else {
						throw new KevScriptError('Component "' + comp.name + '" in node "' + comp.eContainer().name + '" has no port named "' + res[0][2].value + '". Unbind failed', res[0][2].pos);
					}
				}
			}
		});

		chans.forEach(function (chan) {
			ports.forEach(function (port) {
				getBindings(model, chan, port).forEach(function (binding) {
					if (binding.hub) {
						binding.hub.removeBindings(binding);
					}
					if (binding.port) {
						binding.port.removeBindings(binding);
					}
					model.removeMBindings(binding);
				});
			});
		});
	});
};
