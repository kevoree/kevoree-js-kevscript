'use strict';

var shortid = require('../shortid');

module.exports = function (model, expressions, expr, opts) {
	var value;
	var ctxVarKey = expressions[expr.children[0].type](model, expressions, expr.children[0]);
	if (opts.ctxVars[ctxVarKey]) {
		value = opts.ctxVars[ctxVarKey];
	} else {
		opts.ctxVars[ctxVarKey] = value = shortid();
	}
	return value;
};
