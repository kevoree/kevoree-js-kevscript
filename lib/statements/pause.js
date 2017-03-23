'use strict';

module.exports = function (model, expressions, stmt, opts) {
	return Promise.resolve().then(function () {
		opts.warnings.push({
			message: '"pause" statement is deprecated',
			pos: stmt.pos
		});
	});
};
