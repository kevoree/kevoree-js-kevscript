'use strict';

module.exports = function (model, statements, stmt, opts) {
	var child = statements[stmt.children[0].type](model, statements, stmt.children[0], opts);
	return {
		value: child.value,
		pos: stmt.pos
	};
};
