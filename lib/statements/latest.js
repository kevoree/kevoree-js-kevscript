'use strict';

module.exports = function (model, statements, stmt) {
	return {
		value: 'LATEST',
		pos: stmt.pos
	};
};
