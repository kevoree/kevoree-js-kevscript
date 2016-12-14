'use strict';

module.exports = function (model, statements, stmt, opts, cb) {
	opts.warnings.push({
		message: '"namespace" statement is deprecated',
		pos: stmt.pos
	});
  cb();
};
