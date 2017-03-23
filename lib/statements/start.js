'use strict';

var KevScriptError = require('../KevScriptError');

module.exports = function (model, expressions, stmt, opts) {
	return expressions[stmt.children[0].type](model, expressions, stmt.children[0], opts).then(function (nameList) {
		nameList.forEach(function (instancePath) {
			var instances = [];
			if (instancePath.length === 1) {
				// node / chan / group
				instances = model.select('/nodes[' + instancePath[0].value + ']').array
					.concat(model.select('/groups[' + instancePath[0].value + ']').array)
					.concat(model.select('/hubs[' + instancePath[0].value + ']').array);
			} else if (instancePath.length === 2) {
				// component
				instances = model.select('/nodes[' + instancePath[0].value + ']/components[' + instancePath[1].value + ']').array;

			} else {
				throw new KevScriptError('"' + instancePath.value + '" is not a valid path for an instance. Start failed', instancePath.pos);
			}

			if (instancePath.indexOf('*') === -1 && instances.length === 0) {
				throw new KevScriptError('Unable to start "' + instancePath.value + '". Instance does not exist', instancePath.pos);
			} else {
				instances.forEach(function (instance) {
					instance.started = true;
				});
			}
		});
	});
};
