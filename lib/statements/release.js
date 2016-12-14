'use strict';

module.exports = function (model, statements, stmt) {
	return {
		value: 'RELEASE',
		pos: stmt.pos
	};
};
