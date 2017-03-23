'use strict';

var KevScriptError = require('../KevScriptError');

function removeNode(model, node) {
	// remove groups fragment dictionary related to this node
	model.groups.array.forEach(function (group) {
		var dic = group.findFragmentDictionaryByID(node.name);
		if (dic) {
			group.removeFragmentDictionary(dic);
		}
	});

	// remove channels fragment dictionary related to this node
	model.hubs.array.forEach(function (hub) {
		var dic = hub.findFragmentDictionaryByID(node.name);
		if (dic) {
			hub.removeFragmentDictionary(dic);
		}
	});

	// remove bindings related to this node
	node.components.array.forEach(function (comp) {
		comp.provided.array.concat(comp.required.array).forEach(function (port) {
			port.bindings.array.forEach(function (binding) {
				binding.hub.removeBindings(binding);
				model.removeMBindings(binding);
			});
		});
	});

	// delete links with groups
	node.groups.array.forEach(function (group) {
		group.removeSubNodes(node);
	});

	// remove node itself
	if (node.host) {
		node.host.removeHosts(node);
	}
	model.removeNodes(node);
}

function removeGroup(model, group) {
	// remove link between this group and nodes
	group.subNodes.array.forEach(function (node) {
		node.removeGroups(group);
	});
	// remove group
	model.removeGroups(group);
}

function removeChannel(model, chan) {
	model.mBindings.array.forEach(function (binding) {
		if (binding.hub.name === chan.name) {
			if (binding.port) {
				binding.port.removeBindings(binding);
			}
			if (binding.hub) {
				binding.hub.removeBindings(binding);
			}
			model.removeMBindings(binding);
		}
	});
	model.removeHubs(chan);
}

function removeComponent(model, comp) {
	comp.provided.array.concat(comp.required.array).forEach(function (port) {
		port.bindings.array.forEach(function (binding) {
			if (binding.port) {
				binding.port.removeBindings(binding);
			}
			if (binding.hub) {
				binding.hub.removeBindings(binding);
			}
			model.removeMBindings(binding);
		});
	});
	comp.eContainer().removeComponents(comp);
}

function removeFromNode(model, path, node) {
	if (path === '*') {
		// remove all from all nodes
		node.components.array.forEach(function (comp) {
			removeComponent(model, comp);
		});
		node.hosts.array.forEach(function (node) {
			removeNode(model, node);
		});
	} else {
		// remove a specific instance from all nodes
		var comp = node.findComponentsByID(path);
		if (comp) {
			removeComponent(model, comp);
		}
		var subNode = node.findHostsByID(path);
		if (subNode) {
			removeNode(model, subNode);
		}
	}
}

module.exports = function (model, expressions, stmt, opts) {
	var nameList = expressions[stmt.children[0].type](model, expressions, stmt.children[0], opts);
	nameList.forEach(function (instancePath, i) {
		var instance;
		if (instancePath.length === 1) {
			if (instancePath[0] === '*') {
				// remove all
				model.removeAllHubs();
				model.removeAllNodes();
				model.removeAllGroups();
				model.removeAllMBindings();
			} else {
				// path to a node / chan / group
				var instances = model.nodes.array
					.concat(model.hubs.array)
					.concat(model.groups.array);
				for (var j = 0; j < instances.length; j++) {
					if (instances[j].name === instancePath[0]) {
						instance = instances[j];
						break;
					}
				}
				if (instance) {
					if (instance.metaClassName() === 'org.kevoree.ContainerNode') {
						removeNode(model, instance);
					} else if (instance.metaClassName() === 'org.kevoree.Group') {
						removeGroup(model, instance);
					} else if (instance.metaClassName() === 'org.kevoree.Channel') {
						removeChannel(model, instance);
					}
				} else {
					throw new KevScriptError('Unable to remove instance "' + instancePath[0] + '". Instance does not exist', stmt.children[0].children[i].pos);
				}
			}

		} else if (instancePath.length === 2) {
			// path to a component/subNode
			if (instancePath[0] === '*') {
				// remove from all nodes
				model.nodes.array.forEach(function (node) {
					removeFromNode(model, instancePath[1], node);
				});
			} else {
				// remove from a specific node
				var hostNode = model.findNodesByID(instancePath[0]);
				if (hostNode) {
					removeFromNode(model, instancePath[1], hostNode);
				} else {
					throw new KevScriptError('Unable to remove instances from "' + instancePath[0] + '". Instance does not exist', stmt.children[0].children[i].pos);
				}
			}

		} else {
			throw new KevScriptError('Instance path for "remove" statements must be "name" or "hostName.childName". Instance path "' + stmt.children[0].pos + '" is not valid', stmt.children[0].children[0].pos);
		}
	});
};
