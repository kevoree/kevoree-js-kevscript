'use strict';

module.exports = function (model, statements, stmt) {
	return {
		value: parseInt(stmt.children.join(''), 10),
		pos: stmt.pos
	};
};
