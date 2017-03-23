'use strict';

var kevoree = require('kevoree-library');
var modelValidator = require('kevoree-validator');
var promiseUtils = require('./util/promise-utils');

// statements list
var statements = {
	addRepo: require('./statements/addRepo'),
	add: require('./statements/add'),
	move: require('./statements/move'),
	attach: require('./statements/attach'),
	addBinding: require('./statements/addBinding'),
	delBinding: require('./statements/delBinding'),
	include: require('./statements/include'),
	set: require('./statements/set'),
	network: require('./statements/network'),
	remove: require('./statements/remove'),
	detach: require('./statements/detach'),
	namespace: require('./statements/namespace'),
	start: require('./statements/start'),
	stop: require('./statements/stop'),
	pause: require('./statements/pause'),
};

// expressions list
var expressions = {
	typeDef: require('./expressions/typeDef'),
	typeFQN: require('./expressions/typeFQN'),
	nameList: require('./expressions/nameList'),
	instancePath: require('./expressions/instancePath'),
	wildcard: require('./expressions/wildcard'),
	string: require('./expressions/string'),
	string2: require('./expressions/string2'),
	string3: require('./expressions/string3'),
	repoString: require('./expressions/repoString'),
	version: require('./expressions/version'),
	anything: require('./expressions/anything'),
	realString: require('./expressions/realString'),
	realStringNoNewLine: require('./expressions/realStringNoNewLine'),
	newLine: require('./expressions/newLine'),
	singleQuoteLine: require('./expressions/singleQuoteLine'),
	doubleQuoteLine: require('./expressions/doubleQuoteLine'),
	escaped: require('./expressions/escaped'),
	ctxVar: require('./expressions/ctxVar'),
	genCtxVar: require('./expressions/genCtxVar'),
	tdefVersion: require('./expressions/tdefVersion'),
	duVersion: require('./expressions/duVersion'),
	integer: require('./expressions/integer'),
	latest: require('./expressions/latest'),
	release: require('./expressions/release')
};

var factory = new kevoree.factory.DefaultKevoreeFactory();
var cloner = factory.createModelCloner();

/**
 *
 * @param ast
 * @param ctxModel
 * @param opts
 * @param callback
 * @constructor
 */
function interpreter(ast, ctxModel, opts, callback) {
	// output model
	var model = null;

	if (ctxModel) {
		// if we have a context model, clone it and use it has a base
		model = cloner.clone(ctxModel, false);
	} else {
		// otherwise start from a brand new model
		model = factory.createContainerRoot();
	}

	// this ContainerRoot is the root of the model
	factory.root(model);

	opts.warnings = [];

	// process statements
	var commands = [];

	try {
		ast.children.forEach(function (child0) {
			child0.children.forEach(function (stmt) {
				if (typeof (statements[stmt.type]) === 'function') {
					commands.push(function () {
						return statements[stmt.type](model, expressions, stmt, opts);
					});
				} else {
					throw new Error('Unknown statement "' + stmt.type + '"');
				}
			});
		});

		promiseUtils.series(commands)
			.then(function () {
				// all done without issues
				var error;
				try {
					modelValidator(model);
				} catch (err) {
					error = err;
					// try to find instance pos for ModelValidationError
					ast.children
						.map(function (stmt) {
							return stmt.children[0];
						})
						.filter(function (stmt) {
							return stmt.type === 'add';
						})
						.some(function (addStmt) {
							var instancePos = addStmt.instances[err.path];
							if (instancePos) {
								error.pos = instancePos;
								return true;
							}
						});
				} finally {
					callback(error, model, opts.warnings);
				}
			})
			.catch(function (err) {
				// something failed
				callback(err, null, opts.warnings);
			});
	} catch (err) {
		// something failed when constructing commands
		callback(err, null, opts.warnings);
	}
}

module.exports = interpreter;
