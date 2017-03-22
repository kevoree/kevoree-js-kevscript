'use strict';

var FQN = require('../util/fqn');
var KevScriptError = require('../KevScriptError');

module.exports = function typeDef(model, statements, stmt, opts, cb) {
	var typeFqnStmt, versionStmt;

	try {
		typeFqnStmt = statements[stmt.children[0].type](model, statements, stmt.children[0], opts, cb);
	} catch (err) {
		cb(err);
		return;
	}

	if (stmt.children[1]) {
		versionStmt = statements[stmt.children[1].type](model, statements, stmt.children[1], opts, cb);
	}

	var fqn = new FQN(typeFqnStmt.namespace, typeFqnStmt.name, versionStmt);

	opts.resolver.resolve(fqn, model)
		.then(function (tdef) {
			cb(null, tdef);
		})
		.catch(function (err) {
			cb(new KevScriptError(err.message, stmt.pos));
		});
};
