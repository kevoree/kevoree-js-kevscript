'use strict';

module.exports = function (model, expressions, expr) {
	return expr.children[0].children.join('');
};
