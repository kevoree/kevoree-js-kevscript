'use strict';

var kevoree = require('kevoree-library');
var KevScriptError = require('../KevScriptError');
var instanceResolver = require('../util/instance-resolver');

module.exports = function (model, expressions, stmt, opts) {
	var setLeftPart = stmt.children[0];
	var paramValPart, targetNodes;
	if (stmt.children.length === 3) {
		// frag dep
		// (CtxVar | GenCtxVar | RealString)
		paramValPart = stmt.children[2];
		// because the 'set' is like: set instance.param/node = ''
		// and 'node' could be '*' which resolves to a list of target nodes
		targetNodes = instanceResolver(model, expressions, stmt.children[1], model, opts);
	} else {
		// (CtxVar | GenCtxVar | RealString)
		paramValPart = stmt.children[1];
	}

	var leftPart = expressions[setLeftPart.type](model, expressions, setLeftPart, opts);
	if (setLeftPart.length < 2) {
		throw new KevScriptError('"' + leftPart.value + '" is not a valid path to a parameter. Set failed', setLeftPart.pos);
	}

	// separate the instances part of the path from the param name
	var paramPart = setLeftPart.children.splice(-1)[0];
	var instancesPath = expressions[setLeftPart.type](model, expressions, setLeftPart, opts);
	var instances = instanceResolver(model, expressions, setLeftPart, model, opts);
	// if unable to match any instances...cannot set!
	if (instances.length === 0) {
		throw new KevScriptError('Unable to find any instances that matches "' + instancesPath.join('.') + '". Set failed', setLeftPart.pos);
	}

	var paramName = expressions[paramPart.type](model, expressions, paramPart, opts);
	if (paramName === '*') {
		throw new KevScriptError('You must not use wildcard (*) for parameter name. Set failed', setLeftPart.pos);
	}
	var paramVal = expressions[paramValPart.type](model, expressions, paramValPart, opts);

	var factory = new kevoree.factory.DefaultKevoreeFactory();

	if (targetNodes) {
		// the 'set' is for fragmented dictionary
		targetNodes.forEach(function (node) {
			instances.forEach(function (instance) {
				var fDics = instance.select('fragmentDictionary[' + node.name + ']').array;
				if (fDics.length === 0) {
					throw new KevScriptError('Unable to find any fragment dictionary named "' + node.name + '" in instance "' + instance.name + '". Set failed', paramPart.pos);
				} else {
					if (instance.typeDefinition.dictionaryType) {
						var att = instance.typeDefinition.dictionaryType.findAttributesByID(paramName);
						if (att) {
							if (att.fragmentDependant) {
								fDics.forEach(function (dictionary) {
									var dVal = dictionary.findValuesByID(paramName);
									if (!dVal) {
										dVal = factory.createValue();
										dVal.name = paramName;
										dictionary.addValues(dVal);
									}
									dVal.value = paramVal;
								});
							} else {
								throw new KevScriptError('Type "' + instance.typeDefinition.name + '" has a param "' + paramName + '" but it is not fragment dependent. Set failed', paramPart.pos);
							}
						} else {
							throw new KevScriptError('Type "' + instance.typeDefinition.name + '" does not have any "' + paramName + '" parameter in its dictionary. Set failed', paramPart.pos);
						}
					} else {
						throw new KevScriptError('Type "' + instance.typeDefinition.name + '" does not have any fragment dictionary to set. Set failed', paramPart.pos);
					}
				}
			});
		});
	} else {
		// the 'set' is for dictionary
		instances.forEach(function (instance) {
			if (instance.typeDefinition.dictionaryType) {
				var att = instance.typeDefinition.dictionaryType.findAttributesByID(paramName);
				if (att) {
					if (att.fragmentDependant) {
						throw new KevScriptError('Type "' + instance.typeDefinition.name + '" has a param "' + paramName + '" but it is fragment dependent. Set failed', paramPart.pos);
					} else {
						var dVal = instance.dictionary.findValuesByID(paramName);
						if (!dVal) {
							dVal = factory.createValue();
							dVal.name = paramName;
							instance.dictionary.addValues(dVal);
						}
						dVal.value = paramVal;
					}
				} else {
					throw new KevScriptError('Type "' + instance.typeDefinition.name + '" does not have any "' + paramName + '" parameter in its dictionary. Set failed', paramPart.pos);
				}
			} else {
				throw new KevScriptError('Type "' + instance.typeDefinition.name + '" does not have any dictionary to set. Set failed', setLeftPart.pos);
			}
		});
	}

	//
	// if (paramPath.length === 3) {
	// 	// param must be in a component
	//
	//
	// } else if (paramPath.length === 2) {
	// 	// param is in a node|group|chan
	//
	// } else {
	// 	throw new KevScriptError('Parameter "' + paramPath.join('.') + '" does not exist. Set failed', paramPath.pos);
	// }
	//
	// var factory = new kevoree.factory.DefaultKevoreeFactory();
	// if (stmt.children.length === 2) {
	// 	// regular attribute
	// 	return Promise
	// 		.all(
	// 			expressions[stmt.children[0].type](model, expressions, stmt.children[0], opts),
	// 			expressions[stmt.children[1].type](model, expressions, stmt.children[1], opts))
	// 		.then(function (res) {
	// 			console.log('set res[0]', res[0]); // eslint-disable-line
	// 			var instances;
	// 			if (res[0].length) {
	// 				// instance path
	//
	// 			} else {
	//
	// 			}
	// 		});
	//
	// } else if (stmt.children.length === 3) {
	// 	// fragmented attribute
	// 	return Promise.all([
	// 		expressions[stmt.children[0].type](model, expressions, stmt.children[0], opts),
	// 		expressions[stmt.children[1].type](model, expressions, stmt.children[1], opts),
	// 		expressions[stmt.children[2].type](model, expressions, stmt.children[2], opts)
	// 	]).then(function (res) {
	// 		var instances;
	// 		if (res[0].length === 3) {
	// 			throw new KevScriptError('Setting fragmented attribute only makes sense for groups & channels. "' + res[0] + '/' + res[1] + '" can only refer to a component attribute. Set failed', res[0].pos);
	// 		} else if (res[0].length === 2) {
	// 			if (res[1].length === 1) {
	// 				instances = model
	// 					.select('/groups[' + res[0][0] + ']').array
	// 					.concat(model.select('/hubs[' + res[0][0] + ']').array);
	//
	// 				if (instances.length === 0 && res[0][0] !== '*') {
	// 					throw new KevScriptError('There is no group or channel instance named "' + res[0][0] + '". Set failed', res[0][0].pos);
	// 				}
	//
	// 				instances.forEach(function (instance) {
	// 					if (res[1][0] === '*') {
	// 						// all fragments
	// 						instance.fragmentDictionary.array.forEach(function (fDic) {
	// 							updateDictionary(fDic, instance, res[0][1], res[2], true);
	// 						});
	// 					} else {
	// 						// specific fragment
	// 						var fDic = instance.findFragmentDictionaryByID(res[1][0]);
	// 						if (fDic) {
	// 							updateDictionary(fDic, instance, res[0][1], res[2], true);
	// 						} else {
	// 							throw new KevScriptError('Unable to find fragment "' + res[1][0] + '" for instance "' + res[0][0] + '". Set failed', res[1][0].pos);
	// 						}
	// 					}
	// 				});
	// 			} else {
	// 				throw new KevScriptError('Invalid fragment path "' + res[1] + '". Fragment path must be a node name. Set failed', res[1].pos);
	// 			}
	// 		} else {
	// 			throw new KevScriptError('"' + res[0] + '" is not a valid attribute path', res[0].pos);
	// 		}
	// 	});
	// }
};
