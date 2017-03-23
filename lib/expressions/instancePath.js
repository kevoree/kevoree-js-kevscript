'use strict';

module.exports = function (model, expressions, expr, opts) {
	if (expr.children) {
		return expr.children.map(function (expr) {
			return expressions[expr.type](model, expressions, expr, opts);
		});
	} else {
		// console.log('---------'); // eslint-disable-line
		// console.log(expr); // eslint-disable-line
		// console.log('---------'); // eslint-disable-line
		return expr;
	}
};
