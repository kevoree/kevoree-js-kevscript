'use strict';

var KevScriptError = require('../KevScriptError');

module.exports = function (model, statements, stmt) {
	var children = stmt.children
		.filter(function (stmt) {
			return stmt.type;
		})
		.map(function (stmt) {
			return statements[stmt.type](model, statements, stmt).value;
		});

	if (children.length > 2) {
		throw new KevScriptError('Namespaces should no longer contain dots.', stmt.pos);
	} else if (children.length === 1) {
		// default namespace is 'kevoree'
		return {
			namespace: 'kevoree',
			name: children[0],
			pos: stmt.pos
		};
	} else {
		return {
			namespace: children[0],
			name: children[1],
			pos: stmt.pos
		};
	}
};
